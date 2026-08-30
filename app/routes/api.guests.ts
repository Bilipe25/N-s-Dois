import { createHash, randomBytes } from "node:crypto";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { createServerAdminClient } from "@/lib/supabase.server";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { requireUserSession } from "@/sessions";

const ActionSchema = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("add_guest"), names: z.array(z.string().trim().min(1)).min(1).max(100), group_name: z.string().trim().min(1).max(120), adults_count: z.number().int().min(0).max(20), children_count: z.number().int().min(0).max(20) }),
  z.object({ intent: z.literal("update_guest"), id: z.string().uuid(), name: z.string().trim().min(1).max(180), group_name: z.string().trim().min(1).max(120), adults_count: z.number().int().min(0).max(20), children_count: z.number().int().min(0).max(20), status: z.enum(["pendente", "confirmado", "recusado"]) }),
  z.object({ intent: z.literal("update_rsvp"), id: z.string().uuid(), status: z.enum(["pendente", "confirmado", "recusado"]) }),
  z.object({ intent: z.literal("delete_guest"), id: z.string().uuid() }),
  z.object({ intent: z.literal("bulk_confirm"), ids: z.array(z.string().uuid()).min(1).max(200) }),
  z.object({ intent: z.literal("bulk_delete"), ids: z.array(z.string().uuid()).min(1).max(200) }),
  z.object({ intent: z.literal("create_invite_link"), id: z.string().uuid() }),
]);

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserSession(request);
  const supabase = createServerAdminClient();
  const { data: guests, error } = await supabase.from("guests").select("*").order("name");
  if (error) return Response.json({ error: "Não foi possível carregar os convidados." }, { status: 500, headers: noStoreHeaders() });
  return Response.json({ guests: guests || [] }, { headers: noStoreHeaders() });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserSession(request);
  assertSameOrigin(request);
  if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405 });
  const parsed = ActionSchema.safeParse(await readJsonBody(request, 32_768));
  if (!parsed.success) return Response.json({ error: "Dados inválidos.", details: parsed.error.issues }, { status: 400, headers: noStoreHeaders() });
  const supabase = createServerAdminClient();
  const payload = parsed.data;

  if (payload.intent === "add_guest") {
    const rows = payload.names.map((name) => ({ name, group_name: payload.group_name, adults_count: payload.adults_count, children_count: payload.children_count, rsvp_status: "pendente" }));
    const { data, error } = await supabase.from("guests").insert(rows).select("*");
    if (error) return Response.json({ error: "Não foi possível adicionar os convidados." }, { status: 500, headers: noStoreHeaders() });
    const { data: events } = await supabase.from("celebration_events").select("id").eq("state", "published");
    if (events?.length && data?.length) {
      await supabase.from("guest_event_rsvps").insert(data.flatMap((guest) => events.map((event) => ({ guest_id: guest.id, event_id: event.id, adult_limit: payload.adults_count, child_limit: payload.children_count }))));
    }
    await supabase.from("notifications").insert({ type: "rsvp", title: "Lista de convidados atualizada", message: `${user} adicionou ${rows.length} convite(s).`, link: "/guests" });
    return Response.json({ success: true, guests: data }, { status: 201, headers: noStoreHeaders() });
  }

  if (payload.intent === "update_guest") {
    const { error } = await supabase.from("guests").update({ name: payload.name, group_name: payload.group_name, adults_count: payload.adults_count, children_count: payload.children_count, rsvp_status: payload.status }).eq("id", payload.id);
    if (error) return Response.json({ error: "Não foi possível atualizar o convidado." }, { status: 500, headers: noStoreHeaders() });
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }

  if (payload.intent === "update_rsvp") {
    const { error } = await supabase.from("guests").update({ rsvp_status: payload.status }).eq("id", payload.id);
    if (error) return Response.json({ error: "Não foi possível atualizar o RSVP." }, { status: 500, headers: noStoreHeaders() });
    await supabase.from("guest_event_rsvps").update({ status: payload.status, responded_at: payload.status === "pendente" ? null : new Date().toISOString(), updated_at: new Date().toISOString() }).eq("guest_id", payload.id);
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }

  if (payload.intent === "delete_guest") {
    const { error } = await supabase.from("guests").delete().eq("id", payload.id);
    if (error) return Response.json({ error: "Não foi possível excluir o convidado." }, { status: 500, headers: noStoreHeaders() });
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }

  if (payload.intent === "bulk_confirm") {
    const { error } = await supabase.from("guests").update({ rsvp_status: "confirmado" }).in("id", payload.ids);
    if (error) return Response.json({ error: "Não foi possível confirmar os convidados." }, { status: 500, headers: noStoreHeaders() });
    await supabase.from("guest_event_rsvps").update({ status: "confirmado", responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).in("guest_id", payload.ids);
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }

  if (payload.intent === "bulk_delete") {
    const { error } = await supabase.from("guests").delete().in("id", payload.ids);
    if (error) return Response.json({ error: "Não foi possível excluir os convidados." }, { status: 500, headers: noStoreHeaders() });
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date().toISOString();
  const { data: guest } = await supabase.from("guests").select("id").eq("id", payload.id).maybeSingle();
  if (!guest) return Response.json({ error: "Convidado não encontrado." }, { status: 404, headers: noStoreHeaders() });
  await supabase.from("guest_invite_tokens").update({ revoked_at: now }).eq("guest_id", payload.id).is("revoked_at", null);
  const { error } = await supabase.from("guest_invite_tokens").insert({ guest_id: payload.id, token_hash: tokenHash });
  if (error) return Response.json({ error: "Não foi possível gerar o convite." }, { status: 500, headers: noStoreHeaders() });
  const siteUrl = (process.env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  return Response.json({ success: true, inviteUrl: `${siteUrl}/celebracao/convite/${rawToken}` }, { headers: noStoreHeaders() });
}
