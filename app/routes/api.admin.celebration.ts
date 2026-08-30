import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { createServerAdminClient } from "@/lib/supabase.server";
import { requireUserSession } from "@/sessions";

const nullableText = z.string().trim().max(2_000).transform((value) => value || null);
const PageSchema = z.object({
  intent: z.literal("update_page"),
  title: z.string().trim().min(1).max(120),
  subtitle: nullableText,
  story: nullableText,
  postEventMessage: nullableText,
  heroUrl: z.union([z.string().url(), z.literal("")]).transform((value) => value || null),
  ogUrl: z.union([z.string().url(), z.literal("")]).transform((value) => value || null),
  heroFocalX: z.number().int().min(0).max(100),
  heroFocalY: z.number().int().min(0).max(100),
  rsvpEnabled: z.boolean(),
  giftsEnabled: z.boolean(),
  reservationsEnabled: z.boolean(),
  pixEnabled: z.boolean(),
  pixKey: z.string().trim().max(100).transform((value) => value || null),
  pixRecipientName: z.string().trim().max(25).transform((value) => value || null),
  pixCity: z.string().trim().max(15).transform((value) => value || null),
  contactGabriel: z.string().trim().max(30).transform((value) => value || null),
  contactRaabe: z.string().trim().max(30).transform((value) => value || null),
});
const EventSchema = z.object({
  intent: z.literal("upsert_event"),
  id: z.string().uuid().optional(),
  kind: z.enum(["ceremony", "reception", "gathering", "celebration"]),
  title: z.string().trim().min(1).max(160),
  startsAt: z.string().datetime({ offset: true }).nullable(),
  venueName: nullableText,
  address: nullableText,
  mapUrl: z.union([z.string().url(), z.literal("")]).transform((value) => value || null),
  dressCode: nullableText,
  scheduleNote: nullableText,
  sortOrder: z.number().int().min(0).max(100),
  state: z.enum(["draft", "published", "archived"]),
});
const DeleteSchema = z.object({ intent: z.literal("delete_event"), id: z.string().uuid() });
const ActionSchema = z.discriminatedUnion("intent", [PageSchema, EventSchema, DeleteSchema]);

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserSession(request);
  const supabase = createServerAdminClient();
  const [config, events] = await Promise.all([
    supabase.from("app_config").select("id,celebration_title,celebration_subtitle,celebration_story,celebration_post_event_message,celebration_hero_url,celebration_og_url,celebration_hero_focal_x,celebration_hero_focal_y,celebration_rsvp_enabled,celebration_gifts_enabled,celebration_reservations_enabled,celebration_pix_enabled,pix_key,pix_recipient_name,pix_city,contact_phone_gabriel,contact_phone_raabe").limit(1).maybeSingle(),
    supabase.from("celebration_events").select("*").order("sort_order").order("starts_at"),
  ]);
  if (config.error || events.error) return Response.json({ error: "Administração da celebração indisponível até a migração aditiva." }, { status: 503, headers: noStoreHeaders() });
  return Response.json({ config: config.data, events: events.data ?? [] }, { headers: noStoreHeaders() });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserSession(request);
  assertSameOrigin(request);
  if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405, headers: noStoreHeaders() });
  const parsed = ActionSchema.safeParse(await readJsonBody(request, 24_000));
  if (!parsed.success) return Response.json({ error: "Revise os campos informados." }, { status: 400, headers: noStoreHeaders() });
  const supabase = createServerAdminClient();
  const payload = parsed.data;

  if (payload.intent === "update_page") {
    const { error } = await supabase.from("app_config").update({
      celebration_title: payload.title,
      celebration_subtitle: payload.subtitle,
      celebration_story: payload.story,
      celebration_post_event_message: payload.postEventMessage,
      celebration_hero_url: payload.heroUrl,
      celebration_og_url: payload.ogUrl,
      celebration_hero_focal_x: payload.heroFocalX,
      celebration_hero_focal_y: payload.heroFocalY,
      celebration_rsvp_enabled: payload.rsvpEnabled,
      celebration_gifts_enabled: payload.giftsEnabled,
      celebration_reservations_enabled: payload.reservationsEnabled,
      celebration_pix_enabled: payload.pixEnabled,
      pix_key: payload.pixKey,
      pix_recipient_name: payload.pixRecipientName,
      pix_city: payload.pixCity,
      contact_phone_gabriel: payload.contactGabriel,
      contact_phone_raabe: payload.contactRaabe,
    }).not("id", "is", null);
    if (error) return Response.json({ error: "Não foi possível salvar a página." }, { status: 500, headers: noStoreHeaders() });
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }

  if (payload.intent === "delete_event") {
    const { error } = await supabase.from("celebration_events").delete().eq("id", payload.id);
    if (error) return Response.json({ error: "Não foi possível excluir o evento." }, { status: 500, headers: noStoreHeaders() });
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }

  const values = { kind: payload.kind, title: payload.title, starts_at: payload.startsAt, venue_name: payload.venueName, address: payload.address, map_url: payload.mapUrl, dress_code: payload.dressCode, schedule_note: payload.scheduleNote, sort_order: payload.sortOrder, state: payload.state, updated_at: new Date().toISOString() };
  const result = payload.id
    ? await supabase.from("celebration_events").update(values).eq("id", payload.id)
    : await supabase.from("celebration_events").insert(values);
  if (result.error) return Response.json({ error: "Não foi possível salvar o evento." }, { status: 500, headers: noStoreHeaders() });
  return Response.json({ success: true }, { status: payload.id ? 200 : 201, headers: noStoreHeaders() });
}
