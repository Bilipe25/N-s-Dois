import { redirect } from "react-router";
import type { Route } from "./+types/redirect.bridal-shower";

export function loader(_: Route.LoaderArgs) {
  return redirect("/celebracao/admin", 308);
}
