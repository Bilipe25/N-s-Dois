import type { Route } from "./+types/api.public.celebration-gift-reservations.$id";
import { createServerAdminClient } from "@/lib/supabase.server";
import { getInviteGuestId } from "@/lib/celebration-session.server";
import { assertSameOrigin, consumeRateLimit, noStoreHeaders } from "@/lib/security.server";

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "DELETE") return Response.json({ error: "Método não permitido." }, { status: 405 });
  assertSameOrigin(request);
  if (!(await consumeRateLimit(request, "gift-cancel", 20, 15 * 60))) {
    return Response.json({ error: "Muitas tentativas." }, { status: 429, headers: noStoreHeaders() });
  }
  const guestId = await getInviteGuestId(request);
  if (!guestId) return Response.json({ error: "Convite necessário." }, { status: 401, headers: noStoreHeaders() });
  const supabase = createServerAdminClient();
  const { data, error } = await supabase
    .from("gift_reservations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", params.id || "")
    .eq("guest_id", guestId)
    .eq("status", "active")
    .select("id")
    .maybeSingle();
  if (error || !data) return Response.json({ error: "Reserva não encontrada." }, { status: 404, headers: noStoreHeaders() });
  return Response.json({ success: true }, { headers: noStoreHeaders() });
}
