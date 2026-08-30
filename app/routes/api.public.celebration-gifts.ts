import type { Route } from "./+types/api.public.celebration-gifts";
import { createServerAdminClient } from "@/lib/supabase.server";
import { getInviteGuestId } from "@/lib/celebration-session.server";
import { consumeRateLimit, noStoreHeaders } from "@/lib/security.server";
import { getCelebrationConfig } from "@/services/celebration.server";

function httpUrlOrNull(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

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
  const price = (url.searchParams.get("price") || "").slice(0, 32);
  const guestId = await getInviteGuestId(request).catch(() => null);
  const supabase = createServerAdminClient();
  let query = supabase
    .from("bridal_shower_gifts")
    .select("id,item_name,category,suggested_store,link,price_range,price_cents,image_url,gift_reservations!left(id,status,guest_id)")
    .order("item_name");
  if (category && category !== "Todos") query = query.eq("category", category);
  if (search) query = query.ilike("item_name", `%${search.replace(/[%_]/g, "")}%`);
  const { data, error } = await query;
  if (error) return Response.json({ error: "Não foi possível carregar os presentes." }, { status: 500, headers: noStoreHeaders() });

  const priceBounds = /^(\d+)-(\d+)$/.exec(price);
  const filteredRows = (data || []).filter((row) => {
    if (!priceBounds) return true;
    const min = Number(priceBounds[1]) * 100;
    const max = Number(priceBounds[2]) * 100;
    const exact = typeof row.price_cents === "number" ? row.price_cents : null;
    if (exact !== null) return exact >= min && exact <= max;
    const values = String(row.price_range || "").match(/\d+(?:[.,]\d+)?/g)?.map((value) => Number(value.replace(".", "").replace(",", ".")) * 100) || [];
    const comparable = values.at(-1);
    return typeof comparable === "number" && comparable >= min && comparable <= max;
  });
  const offset = /^\d+$/.test(cursor) ? Math.max(0, Number(cursor)) : 0;
  const rows = filteredRows.slice(offset, offset + 13);
  const page = rows.slice(0, 12).map((row) => {
    const reservations = Array.isArray(row.gift_reservations) ? row.gift_reservations : [];
    const active = reservations.find((reservation: { status?: string }) => reservation.status === "active");
    const own = guestId ? reservations.find((reservation: { status?: string; guest_id?: string }) => reservation.status === "active" && reservation.guest_id === guestId) : null;
    return {
      id: row.id,
      item_name: row.item_name,
      category: row.category,
      suggested_store: row.suggested_store,
      link: httpUrlOrNull(row.link),
      price_range: row.price_range,
      price_cents: row.price_cents,
      image_url: httpUrlOrNull(row.image_url),
      available: !active,
      reservation_id: own?.id || null,
    };
  });
  return Response.json({
    gifts: page,
    nextCursor: rows.length > 12 ? String(offset + 12) : null,
    resultCount: filteredRows.length,
  }, { headers: noStoreHeaders() });
}
