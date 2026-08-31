import type { Route } from "./+types/api.public.celebration-rsvp-identify";
import { createInviteSession } from "@/lib/celebration-session.server";
import { normalizeGuestName } from "@/lib/guest-name";
import { assertSameOrigin, consumeRateLimit, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { createServerAdminClient } from "@/lib/supabase.server";
import { IdentifyGuestSchema } from "@/schemas/celebration";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405 });
  assertSameOrigin(request);
  if (!(await consumeRateLimit(request, "public-rsvp-identify", 8, 15 * 60))) {
    return Response.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429, headers: noStoreHeaders() });
  }

  const parsed = IdentifyGuestSchema.safeParse(await readJsonBody(request, 2_048));
  if (!parsed.success) return Response.json({ error: "Informe seu nome completo." }, { status: 400, headers: noStoreHeaders() });

  const supabase = createServerAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select("id,name")
    .eq("name_search_key", normalizeGuestName(parsed.data.name))
    .limit(2);
  if (error) return Response.json({ error: "Não foi possível verificar o nome agora." }, { status: 500, headers: noStoreHeaders() });
  if (!data?.length) return Response.json({ status: "not_found" }, { headers: noStoreHeaders() });
  if (data.length > 1) return Response.json({ status: "ambiguous" }, { headers: noStoreHeaders() });

  const cookie = await createInviteSession(request, String(data[0].id));
  return Response.json(
    { status: "found", displayName: String(data[0].name) },
    { headers: noStoreHeaders({ "Set-Cookie": cookie }) },
  );
}
