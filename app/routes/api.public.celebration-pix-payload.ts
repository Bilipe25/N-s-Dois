import type { Route } from "./+types/api.public.celebration-pix-payload";
import { PixPayloadRequestSchema } from "@/schemas/celebration";
import { createPixPayload } from "@/lib/pix";
import { createServerAdminClient } from "@/lib/supabase.server";
import { getInviteGuestId } from "@/lib/celebration-session.server";
import { assertSameOrigin, consumeRateLimit, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { getCelebrationConfig } from "@/services/celebration.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405 });
  assertSameOrigin(request);
  if (!(await consumeRateLimit(request, "pix-payload", 30, 15 * 60))) {
    return Response.json({ error: "Muitas tentativas." }, { status: 429, headers: noStoreHeaders() });
  }
  const parsed = PixPayloadRequestSchema.safeParse(await readJsonBody(request, 2_048));
  if (!parsed.success) return Response.json({ error: "Solicitação inválida." }, { status: 400, headers: noStoreHeaders() });
  const config = await getCelebrationConfig();
  if (!config.pixEnabled || !config.pixKey || !config.pixRecipientName || !config.pixCity) {
    return Response.json({ error: "PIX não está disponível agora." }, { status: 403, headers: noStoreHeaders() });
  }

  let amountCents: number | null = null;
  let transactionId = "***";
  if (parsed.data.reservationId) {
    const guestId = await getInviteGuestId(request);
    if (!guestId) return Response.json({ error: "Convite necessário." }, { status: 401, headers: noStoreHeaders() });
    const supabase = createServerAdminClient();
    const { data } = await supabase
      .from("gift_reservations")
      .select("id,bridal_shower_gifts!inner(price_cents)")
      .eq("id", parsed.data.reservationId)
      .eq("guest_id", guestId)
      .eq("status", "active")
      .maybeSingle();
    if (!data) return Response.json({ error: "Reserva não encontrada." }, { status: 404, headers: noStoreHeaders() });
    const gift = Array.isArray(data.bridal_shower_gifts) ? data.bridal_shower_gifts[0] : data.bridal_shower_gifts;
    amountCents = gift && typeof gift.price_cents === "number" ? gift.price_cents : null;
    transactionId = `RESERVA${String(data.id).replace(/-/g, "").slice(0, 12)}`;
  } else if (parsed.data.giftId) {
    const supabase = createServerAdminClient();
    const { data } = await supabase
      .from("bridal_shower_gifts")
      .select("id,price_cents,gift_reservations!left(id,status)")
      .eq("id", parsed.data.giftId)
      .maybeSingle();
    if (!data) return Response.json({ error: "Presente não encontrado." }, { status: 404, headers: noStoreHeaders() });
    const reservations = Array.isArray(data.gift_reservations) ? data.gift_reservations : [];
    if (reservations.some((reservation: { status?: string }) => reservation.status === "active")) {
      return Response.json({ error: "Este presente já foi escolhido. O PIX geral continua disponível." }, { status: 409, headers: noStoreHeaders() });
    }
    amountCents = typeof data.price_cents === "number" ? data.price_cents : null;
    transactionId = `PRESENTE${String(data.id).replace(/-/g, "").slice(0, 12)}`;
  }

  try {
    const payload = createPixPayload({
      key: config.pixKey,
      recipientName: config.pixRecipientName,
      city: config.pixCity,
      amountCents,
      transactionId,
    });
    return Response.json({ payload, amountCents }, { headers: noStoreHeaders() });
  } catch {
    return Response.json({ error: "Configuração PIX inválida." }, { status: 422, headers: noStoreHeaders() });
  }
}
