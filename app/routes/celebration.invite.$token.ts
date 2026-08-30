import { createHash } from "node:crypto";
import { redirect } from "react-router";
import type { Route } from "./+types/celebration.invite.$token";
import { createServerAdminClient } from "@/lib/supabase.server";
import { createInviteSession } from "@/lib/celebration-session.server";
import { consumeRateLimit, noStoreHeaders } from "@/lib/security.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const token = params.token || "";
  const allowed = await consumeRateLimit(request, "invite-exchange", 20, 15 * 60);
  if (!allowed || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return redirect("/celebracao?convite=invalido", { headers: noStoreHeaders() });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const supabase = createServerAdminClient();
  const { data: invite } = await supabase
    .from("guest_invite_tokens")
    .select("id,guest_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (!invite) return redirect("/celebracao?convite=invalido", { headers: noStoreHeaders() });

  await supabase.from("guest_invite_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", invite.id);
  const cookie = await createInviteSession(request, invite.guest_id);
  return redirect("/celebracao", { headers: noStoreHeaders({ "Set-Cookie": cookie }) });
}
