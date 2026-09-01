import { createServerAdminClient } from "@/lib/supabase.server";
import { getInviteGuestId } from "@/lib/celebration-session.server";
import type { CelebrationEvent, InvitationEvent, PublicGift } from "@/schemas/celebration";
import { getCelebrationPhase } from "@/lib/celebration-time";

export type CelebrationConfig = {
  title: string;
  subtitle: string | null;
  story: string | null;
  postEventMessage: string | null;
  heroUrl: string | null;
  ogUrl: string | null;
  heroFocalX: number;
  heroFocalY: number;
  rsvpEnabled: boolean;
  publicRsvpAdultLimit: number;
  publicRsvpChildLimit: number;
  giftsEnabled: boolean;
  giftSuggestionsEnabled: boolean;
  reservationsEnabled: boolean;
  pixEnabled: boolean;
  pixKey: string | null;
  pixRecipientName: string | null;
  pixCity: string | null;
  contactGabriel: string | null;
  contactRaabe: string | null;
};

export type CelebrationLoaderData = {
  config: CelebrationConfig;
  events: CelebrationEvent[];
  invitation: {
    active: boolean;
    displayName: string | null;
    responses: InvitationEvent[];
    general: {
      adult_limit: number;
      child_limit: number;
      confirmed_adults: number;
      confirmed_children: number;
      status: "pendente" | "confirmado" | "recusado";
      private_message: string | null;
      is_public_registration: boolean;
    } | null;
  };
  gifts: PublicGift[];
  giftCursor: string | null;
  categories: string[];
  giftStats: { total: number; reserved: number };
  migrationReady: boolean;
};

const defaultConfig: CelebrationConfig = {
  title: "Celebrando o Amor e o Novo Lar",
  subtitle: null,
  story: "Uma celebração feita para estar perto de quem faz parte da nossa história.",
  postEventMessage: "Obrigado por celebrar este capítulo com a gente.",
  heroUrl: null,
  ogUrl: null,
  heroFocalX: 50,
  heroFocalY: 50,
  rsvpEnabled: false,
  publicRsvpAdultLimit: 6,
  publicRsvpChildLimit: 6,
  giftsEnabled: false,
  giftSuggestionsEnabled: true,
  reservationsEnabled: false,
  pixEnabled: false,
  pixKey: null,
  pixRecipientName: null,
  pixCity: null,
  contactGabriel: null,
  contactRaabe: null,
};

type ConfigRow = Record<string, unknown>;

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function httpUrlOrNull(value: unknown) {
  const candidate = stringOrNull(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? candidate : null;
  } catch {
    return null;
  }
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function configFromRow(row: ConfigRow | null): CelebrationConfig {
  if (!row) return defaultConfig;
  return {
    title: stringOrNull(row.celebration_title) || defaultConfig.title,
    subtitle: stringOrNull(row.celebration_subtitle),
    story: stringOrNull(row.celebration_story) || defaultConfig.story,
    postEventMessage: stringOrNull(row.celebration_post_event_message) || defaultConfig.postEventMessage,
    heroUrl: httpUrlOrNull(row.celebration_hero_url) || httpUrlOrNull(row.bridal_shower_hero_url),
    ogUrl: httpUrlOrNull(row.celebration_og_url),
    heroFocalX: numberOr(row.celebration_hero_focal_x, 50),
    heroFocalY: numberOr(row.celebration_hero_focal_y, 50),
    rsvpEnabled: row.celebration_rsvp_enabled === true,
    publicRsvpAdultLimit: Math.min(20, Math.max(0, numberOr(row.celebration_public_rsvp_adult_limit, 6))),
    publicRsvpChildLimit: Math.min(20, Math.max(0, numberOr(row.celebration_public_rsvp_child_limit, 6))),
    giftsEnabled: row.celebration_gifts_enabled === true,
    giftSuggestionsEnabled: row.bridal_shower_show_links !== false,
    reservationsEnabled: row.celebration_reservations_enabled === true,
    pixEnabled: row.celebration_pix_enabled === true,
    pixKey: stringOrNull(row.pix_key),
    pixRecipientName: stringOrNull(row.pix_recipient_name),
    pixCity: stringOrNull(row.pix_city),
    contactGabriel: stringOrNull(row.contact_phone_gabriel),
    contactRaabe: stringOrNull(row.contact_phone_raabe),
  };
}

function publicGift(row: Record<string, unknown>, ownReservations: Map<string, string>): PublicGift {
  const id = String(row.id);
  return {
    id,
    item_name: String(row.item_name || "Presente"),
    category: stringOrNull(row.category),
    suggested_store: stringOrNull(row.suggested_store),
    link: httpUrlOrNull(row.link),
    price_range: stringOrNull(row.price_range),
    price_cents: typeof row.price_cents === "number" ? row.price_cents : null,
    image_url: httpUrlOrNull(row.image_url),
    available: row.has_active_reservation !== true,
    reservation_id: ownReservations.get(id) || null,
  };
}

export async function loadCelebration(request: Request): Promise<CelebrationLoaderData> {
  const supabase = createServerAdminClient();
  const guestId = await getInviteGuestId(request).catch(() => null);

  let configResult = await supabase
    .from("app_config")
    .select("celebration_title,celebration_subtitle,celebration_story,celebration_post_event_message,celebration_hero_url,celebration_og_url,celebration_hero_focal_x,celebration_hero_focal_y,celebration_rsvp_enabled,celebration_public_rsvp_adult_limit,celebration_public_rsvp_child_limit,celebration_gifts_enabled,celebration_reservations_enabled,celebration_pix_enabled,bridal_shower_hero_url,bridal_shower_show_links,pix_key,pix_recipient_name,pix_city,contact_phone_gabriel,contact_phone_raabe")
    .limit(1)
    .maybeSingle();
  if (configResult.error && /celebration_public_rsvp_(adult|child)_limit/i.test(configResult.error.message)) {
    configResult = await supabase
      .from("app_config")
      .select("celebration_title,celebration_subtitle,celebration_story,celebration_post_event_message,celebration_hero_url,celebration_og_url,celebration_hero_focal_x,celebration_hero_focal_y,celebration_rsvp_enabled,celebration_gifts_enabled,celebration_reservations_enabled,celebration_pix_enabled,bridal_shower_hero_url,bridal_shower_show_links,pix_key,pix_recipient_name,pix_city,contact_phone_gabriel,contact_phone_raabe")
      .limit(1)
      .maybeSingle();
  }
  const { data: configRow, error: configError } = configResult;

  if (configError) {
    console.warn("Configuração da celebração ainda não migrada.", configError.message);
    return {
      config: defaultConfig,
      events: [],
      invitation: { active: false, displayName: null, responses: [], general: null },
      gifts: [],
      giftCursor: null,
      categories: [],
      giftStats: { total: 0, reserved: 0 },
      migrationReady: false,
    };
  }

  const config = configFromRow(configRow as ConfigRow | null);
  const [{ data: eventRows, error: eventsError }, { data: giftRows, error: giftsError }] = await Promise.all([
    supabase
      .from("celebration_events")
      .select("id,kind,title,starts_at,venue_name,address,map_url,dress_code,schedule_note,sort_order,state")
      .eq("state", "published")
      .order("sort_order")
      .order("starts_at", { ascending: true }),
    config.giftsEnabled
      ? supabase
          .from("bridal_shower_gifts")
          .select("id,item_name,category,suggested_store,link,price_range,price_cents,image_url,gift_reservations!left(id,status,guest_id)")
          .order("item_name")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventsError || giftsError) {
    console.error("Falha ao carregar dados públicos da celebração.", eventsError || giftsError);
  }

  const responses: InvitationEvent[] = [];
  const ownReservations = new Map<string, string>();
  let displayName: string | null = null;
  let general: CelebrationLoaderData["invitation"]["general"] = null;

  if (guestId) {
    const [{ data: guest }, { data: rsvpRows }, { data: reservationRows }] = await Promise.all([
      supabase
        .from("guests")
        .select("id,name,source,adults_count,children_count,rsvp_status,rsvp_adults,rsvp_children,rsvp_message")
        .eq("id", guestId)
        .maybeSingle(),
      supabase
        .from("guest_event_rsvps")
        .select("id,event_id,adult_limit,child_limit,confirmed_adults,confirmed_children,status,private_message,celebration_events!inner(state)")
        .eq("guest_id", guestId)
        .eq("celebration_events.state", "published"),
      supabase
        .from("gift_reservations")
        .select("id,gift_id")
        .eq("guest_id", guestId)
        .eq("status", "active"),
    ]);

    displayName = guest?.id ? stringOrNull(guest.name) : null;
    if (displayName && guest) {
      const isPublicRegistration = guest.source === "public_rsvp";
      general = {
        adult_limit: isPublicRegistration ? config.publicRsvpAdultLimit : Math.max(0, Number(guest.adults_count || 0)),
        child_limit: isPublicRegistration ? config.publicRsvpChildLimit : Math.max(0, Number(guest.children_count || 0)),
        confirmed_adults: Math.max(0, Number(guest.rsvp_adults || 0)),
        confirmed_children: Math.max(0, Number(guest.rsvp_children || 0)),
        status: (["confirmado", "recusado"] as const).includes(guest.rsvp_status) ? guest.rsvp_status : "pendente",
        private_message: stringOrNull(guest.rsvp_message),
        is_public_registration: isPublicRegistration,
      };
    }

    for (const row of displayName ? rsvpRows || [] : []) {
      responses.push({
        id: String(row.id),
        event_id: String(row.event_id),
        adult_limit: Number(row.adult_limit || 0),
        child_limit: Number(row.child_limit || 0),
        confirmed_adults: Number(row.confirmed_adults || 0),
        confirmed_children: Number(row.confirmed_children || 0),
        status: row.status as InvitationEvent["status"],
        private_message: stringOrNull(row.private_message),
      });
    }
    for (const row of displayName ? reservationRows || [] : []) ownReservations.set(String(row.gift_id), String(row.id));
  }

  const rawGifts = (giftRows || []).map((row) => {
    const reservations = Array.isArray(row.gift_reservations) ? row.gift_reservations : [];
    return {
      ...row,
      has_active_reservation: reservations.some((reservation: { status?: string }) => reservation.status === "active"),
    };
  });
  const pageRows = rawGifts.slice(0, 12);

  return {
    config,
    events: (eventRows || []) as CelebrationEvent[],
    invitation: { active: Boolean(displayName), displayName, responses, general },
    gifts: pageRows.map((row) => publicGift(row, ownReservations)),
    giftCursor: rawGifts.length > 12 ? "12" : null,
    categories: [...new Set(rawGifts.map((row) => stringOrNull(row.category)).filter((value): value is string => Boolean(value)))].sort(),
    giftStats: {
      total: rawGifts.length,
      reserved: rawGifts.filter((row) => row.has_active_reservation).length,
    },
    migrationReady: true,
  };
}

export async function getCelebrationConfig() {
  const supabase = createServerAdminClient();
  const { data, error } = await supabase.from("app_config").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return configFromRow(data as ConfigRow | null);
}

export async function celebrationIsPast() {
  const supabase = createServerAdminClient();
  const { data, error } = await supabase.from("celebration_events").select("starts_at").eq("state", "published");
  if (error) throw error;
  return getCelebrationPhase(data ?? []) === "past";
}
