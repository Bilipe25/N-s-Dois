import { redirect } from "react-router";
import type { Route } from "./+types/redirect.public-celebration";

export function loader(_: Route.LoaderArgs) {
  return redirect("/celebracao", 308);
}
