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
  if (!guestId) return Response.json({ error: "Identifique-se antes de confirmar." }, { status: 401, headers: noStoreHeaders() });
  const config = await getCelebrationConfig();
  if (!config.rsvpEnabled || await celebrationIsPast()) return Response.json({ error: "As confirmações não estão disponíveis agora." }, { status: 403, headers: noStoreHeaders() });

  const parsed = RsvpRequestSchema.safeParse(await readJsonBody(request, 12_000));
  if (!parsed.success) return Response.json({ error: "Revise os dados da resposta." }, { status: 400, headers: noStoreHeaders() });

  const supabase = createServerAdminClient();
  if ("generalResponse" in parsed.data) {
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id,source,adults_count,children_count,rsvp_status,rsvp_adults,rsvp_children,rsvp_message")
      .eq("id", guestId)
      .maybeSingle();
    if (guestError || !guest) return Response.json({ error: "Não foi possível validar sua identificação." }, { status: 403, headers: noStoreHeaders() });

    const response = parsed.data.generalResponse;
    const adultLimit = guest.source === "public_rsvp" ? 6 : Math.max(0, Number(guest.adults_count || 0));
    const childLimit = guest.source === "public_rsvp" ? 6 : Math.max(0, Number(guest.children_count || 0));
    const adults = response.status === "recusado" ? 0 : response.confirmedAdults;
    const children = response.status === "recusado" ? 0 : response.confirmedChildren;
    if (adults > adultLimit || children > childLimit || (response.status === "confirmado" && adults < 1)) {
      return Response.json({ error: "A quantidade ultrapassa o limite permitido." }, { status: 400, headers: noStoreHeaders() });
    }

    const message = response.message || null;
    if (guest.rsvp_status === response.status && Number(guest.rsvp_adults || 0) === adults && Number(guest.rsvp_children || 0) === children && (guest.rsvp_message || null) === message) {
      return Response.json({ success: true, updated: false }, { headers: noStoreHeaders() });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from("guests").update({
      rsvp_status: response.status,
      rsvp_adults: adults,
      rsvp_children: children,
      rsvp_message: message,
      rsvp_responded_at: now,
    }).eq("id", guestId);
    if (updateError) return Response.json({ error: "Não foi possível salvar a resposta." }, { status: 500, headers: noStoreHeaders() });

    await supabase.from("notifications").insert({
      type: "rsvp",
      title: "Resposta de presença recebida",
      message: "Uma resposta de presença foi atualizada.",
      link: "/guests",
    });
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }

  const eventIds = parsed.data.eventResponses.map((response) => response.eventId);
  const { data: allowedRows, error } = await supabase
    .from("guest_event_rsvps")
    .select("id,event_id,adult_limit,child_limit,status,confirmed_adults,confirmed_children,private_message,celebration_events!inner(state)")
    .eq("guest_id", guestId)
    .in("event_id", eventIds)
    .eq("celebration_events.state", "published");
  if (error) return Response.json({ error: "Não foi possível validar o convite." }, { status: 500, headers: noStoreHeaders() });

  const allowedByEvent = new Map((allowedRows || []).map((row) => [String(row.event_id), row]));
  if (allowedByEvent.size !== eventIds.length) {
    return Response.json({ error: "Um dos eventos não pertence a este convite." }, { status: 403, headers: noStoreHeaders() });
  }

  let updated = false;
  for (const response of parsed.data.eventResponses) {
    const row = allowedByEvent.get(response.eventId)!;
    const adults = response.status === "recusado" ? 0 : response.confirmedAdults;
    const children = response.status === "recusado" ? 0 : response.confirmedChildren;
    if (adults > Number(row.adult_limit) || children > Number(row.child_limit)) {
      return Response.json({ error: "A quantidade ultrapassa o limite do convite." }, { status: 400, headers: noStoreHeaders() });
    }

    const message = response.message || null;
    if (row.status === response.status && Number(row.confirmed_adults || 0) === adults && Number(row.confirmed_children || 0) === children && (row.private_message || null) === message) continue;

    const { error: updateError } = await supabase
      .from("guest_event_rsvps")
      .update({
        status: response.status,
        confirmed_adults: adults,
        confirmed_children: children,
        private_message: message,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("guest_id", guestId);
    if (updateError) return Response.json({ error: "Não foi possível salvar a resposta." }, { status: 500, headers: noStoreHeaders() });
    updated = true;
  }

  if (!updated) return Response.json({ success: true, updated: false }, { headers: noStoreHeaders() });

  const statuses = parsed.data.eventResponses.map((response) => response.status);
  const legacyStatus = statuses.includes("confirmado") ? "confirmado" : "recusado";
  const maxAdults = Math.max(...parsed.data.eventResponses.map((response) => response.status === "recusado" ? 0 : response.confirmedAdults));
  const maxChildren = Math.max(...parsed.data.eventResponses.map((response) => response.status === "recusado" ? 0 : response.confirmedChildren));
  const firstMessage = parsed.data.eventResponses.find((response) => response.message)?.message || null;
  await supabase.from("guests").update({
    rsvp_status: legacyStatus,
    rsvp_adults: maxAdults,
    rsvp_children: maxChildren,
    rsvp_message: firstMessage,
    rsvp_responded_at: new Date().toISOString(),
  }).eq("id", guestId);
  await supabase.from("notifications").insert({
    type: "rsvp",
    title: "Resposta de convite recebida",
    message: "Um convite individual foi atualizado.",
    link: "/guests",
  });

  return Response.json({ success: true, updated: true }, { headers: noStoreHeaders() });
}
