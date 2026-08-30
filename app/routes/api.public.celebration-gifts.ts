import type { Route } from "./+types/api.public.celebration-gifts";
import { createServerAdminClient } from "@/lib/supabase.server";
import { getInviteGuestId } from "@/lib/celebration-session.server";
import { consumeRateLimit, noStoreHeaders } from "@/lib/security.server";
import { getCelebrationConfig } from "@/services/celebration.server";

export async function loader({ request }: Route.LoaderArgs) {
  if (!(await consumeRateLimit(request, "gift-list", 120, 15 * 60))) {
    return Response.json({ error: "Muitas tentativas." }, { status: 429, headers: noStoreHeaders() });
  }
  const config = await getCelebrationConfig();
  if (!config.giftsEnabled) return Response.json({ gifts: [], nextCursor: null }, { headers: noStoreHeaders() });

  const url = new URL(request.url);
  const cursor = (url.searchParams.get("cursor") || "").slice(0, 160);
  const category = (url.searchParams.get("category") || "").slice(0, 80);
  const search = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const guestId = await getInviteGuestId(request).catch(() => null);
  const supabase = createServerAdminClient();
  let query = supabase
    .from("bridal_shower_gifts")
    .select("id,item_name,category,link,price_range,price_cents,image_url,gift_reservations!left(id,status,guest_id)")
    .order("item_name")
    .limit(13);
  if (cursor) query = query.gt("item_name", cursor);
  if (category && category !== "Todos") query = query.eq("category", category);
  if (search) query = query.ilike("item_name", `%${search.replace(/[%_]/g, "")}%`);
  const { data, error } = await query;
  if (error) return Response.json({ error: "Não foi possível carregar os presentes." }, { status: 500, headers: noStoreHeaders() });

  const rows = data || [];
  const page = rows.slice(0, 12).map((row) => {
    const reservations = Array.isArray(row.gift_reservations) ? row.gift_reservations : [];
    const active = reservations.find((reservation: { status?: string }) => reservation.status === "active");
    const own = guestId ? reservations.find((reservation: { status?: string; guest_id?: string }) => reservation.status === "active" && reservation.guest_id === guestId) : null;
    return {
      id: row.id,
      item_name: row.item_name,
      category: row.category,
      link: row.link,
      price_range: row.price_range,
      price_cents: row.price_cents,
      image_url: row.image_url,
      available: !active,
      reservation_id: own?.id || null,
    };
  });
  return Response.json({ gifts: page, nextCursor: rows.length > 12 ? page.at(-1)?.item_name || null : null }, { headers: noStoreHeaders() });
}
