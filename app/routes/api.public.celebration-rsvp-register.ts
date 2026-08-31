import type { Route } from "./+types/api.public.celebration-rsvp-register";
import { createInviteSession } from "@/lib/celebration-session.server";
import { cleanGuestName, normalizeGuestName, normalizeOptionalPhone } from "@/lib/guest-name";
import { assertSameOrigin, consumeRateLimit, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { createServerAdminClient } from "@/lib/supabase.server";
import { PublicRsvpRegistrationSchema } from "@/schemas/celebration";
import { celebrationIsPast, getCelebrationConfig } from "@/services/celebration.server";

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

  const supabase = createServerAdminClient();
  const key = normalizeGuestName(parsed.data.name);
  const { data: existing, error: lookupError } = await supabase.from("guests").select("id").eq("name_search_key", key).limit(2);
  if (lookupError) return Response.json({ error: "Não foi possível verificar o nome agora." }, { status: 500, headers: noStoreHeaders() });
  if (existing?.length) return Response.json({ status: existing.length > 1 ? "ambiguous" : "already_exists" }, { status: 409, headers: noStoreHeaders() });

  const { data: guestId, error } = await supabase.rpc("create_public_rsvp_guest", {
    p_name: cleanGuestName(parsed.data.name),
    p_status: parsed.data.status,
    p_adults: parsed.data.status === "recusado" ? 0 : parsed.data.confirmedAdults,
    p_children: parsed.data.status === "recusado" ? 0 : parsed.data.confirmedChildren,
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
