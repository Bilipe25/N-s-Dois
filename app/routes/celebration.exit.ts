import { redirect } from "react-router";
import type { Route } from "./+types/celebration.exit";
import { clearInviteSession } from "@/lib/celebration-session.server";
import { assertSameOrigin, noStoreHeaders } from "@/lib/security.server";

export async function loader() {
  return redirect("/celebracao", { headers: noStoreHeaders() });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405, headers: noStoreHeaders() });
  }

  assertSameOrigin(request);
  const cookie = await clearInviteSession(request);
  return redirect("/celebracao", { headers: noStoreHeaders({ "Set-Cookie": cookie }) });
}
