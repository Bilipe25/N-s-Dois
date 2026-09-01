import type { Route } from "./+types/api.public.celebration-gift-reservations";
import { GiftReservationRequestSchema } from "@/schemas/celebration";
import { createServerAdminClient } from "@/lib/supabase.server";
import { getInviteGuestId } from "@/lib/celebration-session.server";
import { assertSameOrigin, consumeRateLimit, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { celebrationIsPast, getCelebrationConfig } from "@/services/celebration.server";
import { buildGiftNotification, notifyAdminsBestEffort } from "@/services/admin-notifications.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405 });
  assertSameOrigin(request);
  if (!(await consumeRateLimit(request, "gift-reservation", 20, 15 * 60))) {
    return Response.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429, headers: noStoreHeaders() });
  }
  const guestId = await getInviteGuestId(request);
  if (!guestId) return Response.json({ error: "Precisamos reconhecer você novamente." }, { status: 401, headers: noStoreHeaders() });
  const config = await getCelebrationConfig();
  if (!config.giftsEnabled || !config.reservationsEnabled) {
    return Response.json({ error: "Reservas não estão disponíveis agora." }, { status: 403, headers: noStoreHeaders() });
  }
  if (await celebrationIsPast()) return Response.json({ error: "Novas reservas não estão disponíveis após a celebração." }, { status: 403, headers: noStoreHeaders() });

  const parsed = GiftReservationRequestSchema.safeParse(await readJsonBody(request, 2_048));
  if (!parsed.success) return Response.json({ error: "Presente inválido." }, { status: 400, headers: noStoreHeaders() });

  const supabase = createServerAdminClient();
  const [{ data: gift }, { data: guest }] = await Promise.all([
    supabase.from("bridal_shower_gifts").select("id,item_name,image_url").eq("id", parsed.data.giftId).maybeSingle(),
    supabase.from("guests").select("id,name").eq("id", guestId).maybeSingle(),
  ]);
  if (!gift || !guest) return Response.json({ error: "Presente indisponível." }, { status: 404, headers: noStoreHeaders() });

  const { data, error } = await supabase
    .from("gift_reservations")
    .insert({
      gift_id: gift.id,
      guest_id: guestId,
      reserved_by_name_snapshot: guest.name,
      status: "active",
    })
    .select("id")
    .single();
  if (error?.code === "23505") {
    const { data: ownReservation } = await supabase
      .from("gift_reservations")
      .select("id")
      .eq("gift_id", gift.id)
      .eq("guest_id", guestId)
      .eq("status", "active")
      .maybeSingle();
    if (ownReservation) {
      return Response.json({ success: true, reservationId: ownReservation.id, existing: true }, { headers: noStoreHeaders() });
    }
    return Response.json({ error: "Esse presente acabou de ser escolhido por outra pessoa." }, { status: 409, headers: noStoreHeaders() });
  }
  if (error) return Response.json({ error: "Não foi possível reservar o presente." }, { status: 500, headers: noStoreHeaders() });
  const notification = buildGiftNotification({ action: "reserved", guestName: guest.name, giftName: gift.item_name });
  await notifyAdminsBestEffort({
    request,
    type: "gift",
    ...notification,
    link: `/celebracao/admin?gift=${gift.id}`,
    imageUrl: gift.image_url,
  });
  return Response.json({ success: true, reservationId: data.id }, { status: 201, headers: noStoreHeaders() });
}
