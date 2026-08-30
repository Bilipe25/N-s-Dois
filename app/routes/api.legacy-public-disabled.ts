import type { Route } from "./+types/api.legacy-public-disabled";
import { noStoreHeaders } from "@/lib/security.server";

function gone() {
  return Response.json(
    { error: "Este fluxo foi desativado. Use o link individual da celebração." },
    { status: 410, headers: noStoreHeaders() },
  );
}

export function loader(_: Route.LoaderArgs) { return gone(); }
export function action(_: Route.ActionArgs) { return gone(); }
