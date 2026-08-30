import type { Route } from "./+types/api.public.celebration-rsvp";
import { RsvpRequestSchema } from "@/schemas/celebration";
import { createServerAdminClient } from "@/lib/supabase.server";
import { getInviteGuestId } from "@/lib/celebration-session.server";
import { assertSameOrigin, consumeRateLimit, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { celebrationIsPast, getCelebrationConfig } from "@/services/celebration.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405 });
  assertSameOrigin(request);
  if (!(await consumeRateLimit(request, "public-rsvp", 12, 15 * 60))) {
    return Response.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429, headers: noStoreHeaders() });
  }

  const guestId = await getInviteGuestId(request);
  if (!guestId) return Response.json({ error: "Abra o link individual do seu convite." }, { status: 401, headers: noStoreHeaders() });
  const config = await getCelebrationConfig();
  if (!config.rsvpEnabled || await celebrationIsPast()) return Response.json({ error: "As confirmações não estão disponíveis agora." }, { status: 403, headers: noStoreHeaders() });

  const parsed = RsvpRequestSchema.safeParse(await readJsonBody(request, 12_000));
  if (!parsed.success) return Response.json({ error: "Revise os dados da resposta." }, { status: 400, headers: noStoreHeaders() });

  const supabase = createServerAdminClient();
  const eventIds = parsed.data.eventResponses.map((response) => response.eventId);
  const { data: allowedRows, error } = await supabase
    .from("guest_event_rsvps")
    .select("id,event_id,adult_limit,child_limit,celebration_events!inner(state)")
    .eq("guest_id", guestId)
    .in("event_id", eventIds)
    .eq("celebration_events.state", "published");
  if (error) return Response.json({ error: "Não foi possível validar o convite." }, { status: 500, headers: noStoreHeaders() });

  const allowedByEvent = new Map((allowedRows || []).map((row) => [String(row.event_id), row]));
  if (allowedByEvent.size !== eventIds.length) {
    return Response.json({ error: "Um dos eventos não pertence a este convite." }, { status: 403, headers: noStoreHeaders() });
  }

  for (const response of parsed.data.eventResponses) {
    const row = allowedByEvent.get(response.eventId)!;
    const adults = response.status === "recusado" ? 0 : response.confirmedAdults;
    const children = response.status === "recusado" ? 0 : response.confirmedChildren;
    if (adults > Number(row.adult_limit) || children > Number(row.child_limit)) {
      return Response.json({ error: "A quantidade ultrapassa o limite do convite." }, { status: 400, headers: noStoreHeaders() });
    }

    const { error: updateError } = await supabase
      .from("guest_event_rsvps")
      .update({
        status: response.status,
        confirmed_adults: adults,
        confirmed_children: children,
        private_message: response.message || null,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("guest_id", guestId);
    if (updateError) return Response.json({ error: "Não foi possível salvar a resposta." }, { status: 500, headers: noStoreHeaders() });
  }

  const statuses = parsed.data.eventResponses.map((response) => response.status);
  const legacyStatus = statuses.includes("confirmado") ? "confirmado" : "recusado";
  await supabase.from("guests").update({ rsvp_status: legacyStatus }).eq("id", guestId);
  await supabase.from("notifications").insert({
    type: "rsvp",
    title: "Resposta de convite recebida",
    message: "Um convite individual foi atualizado.",
    link: "/guests",
  });

  return Response.json({ success: true }, { headers: noStoreHeaders() });
}
