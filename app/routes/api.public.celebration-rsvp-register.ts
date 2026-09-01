import type { Route } from "./+types/api.public.celebration-rsvp-register";
import { createInviteSession } from "@/lib/celebration-session.server";
import { cleanGuestName, normalizeGuestName, normalizeOptionalPhone } from "@/lib/guest-name";
import { assertSameOrigin, consumeRateLimit, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { createServerAdminClient } from "@/lib/supabase.server";
import { PublicRsvpRegistrationSchema } from "@/schemas/celebration";
import { celebrationIsPast, getCelebrationConfig } from "@/services/celebration.server";
import { guestLimitText } from "@/lib/guest-rsvp";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405 });
  assertSameOrigin(request);
  if (!(await consumeRateLimit(request, "public-rsvp-register", 4, 60 * 60))) {
    return Response.json({ error: "Muitas tentativas. Aguarde antes de tentar novamente." }, { status: 429, headers: noStoreHeaders() });
  }

  const parsed = PublicRsvpRegistrationSchema.safeParse(await readJsonBody(request, 4_096));
  if (!parsed.success) return Response.json({ error: "Revise os dados da confirmação." }, { status: 400, headers: noStoreHeaders() });
  const config = await getCelebrationConfig();
  if (!config.rsvpEnabled || await celebrationIsPast()) {
    return Response.json({ error: "As confirmações não estão disponíveis agora." }, { status: 403, headers: noStoreHeaders() });
  }
  const adults = parsed.data.status === "recusado" ? 0 : parsed.data.confirmedAdults;
  const children = parsed.data.status === "recusado" ? 0 : parsed.data.confirmedChildren;
  if (adults > config.publicRsvpAdultLimit || children > config.publicRsvpChildLimit) {
    return Response.json({ error: `Este cadastro permite até ${guestLimitText(config.publicRsvpAdultLimit, config.publicRsvpChildLimit)}.` }, { status: 400, headers: noStoreHeaders() });
  }

  const supabase = createServerAdminClient();
  const key = normalizeGuestName(parsed.data.name);
  const { data: knownGuests, error: lookupError } = await supabase.from("guests").select("id,name").limit(1000);
  if (lookupError) return Response.json({ error: "Não foi possível verificar o nome agora." }, { status: 500, headers: noStoreHeaders() });
  const existing = (knownGuests || []).filter((guest) => normalizeGuestName(String(guest.name)) === key).slice(0, 2);
  if (existing?.length) return Response.json({ status: existing.length > 1 ? "ambiguous" : "already_exists" }, { status: 409, headers: noStoreHeaders() });

  const { data: guestId, error } = await supabase.rpc("create_public_rsvp_guest", {
    p_name: cleanGuestName(parsed.data.name),
    p_status: parsed.data.status,
    p_adults: adults,
    p_children: children,
    p_message: parsed.data.message || null,
    p_phone: normalizeOptionalPhone(parsed.data.phone),
  });
  if (error || !guestId) {
    const conflict = error?.code === "23505";
    return Response.json({ error: conflict ? "Este nome já foi identificado. Tente entrar novamente." : "Não foi possível registrar sua resposta." }, { status: conflict ? 409 : 500, headers: noStoreHeaders() });
  }

  const cookie = await createInviteSession(request, String(guestId));
  return Response.json(
    { status: "registered", displayName: cleanGuestName(parsed.data.name) },
    { status: 201, headers: noStoreHeaders({ "Set-Cookie": cookie }) },
  );
}
