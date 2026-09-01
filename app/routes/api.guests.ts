import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { createServerAdminClient } from "@/lib/supabase.server";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { requireUserSession } from "@/sessions";
import { generateInviteToken } from "@/lib/invite-token";
import { CreateInviteLinkActionSchema, RotateInviteLinkActionSchema } from "@/schemas/invite";

const ActionSchema = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("add_guest"), names: z.array(z.string().trim().min(1)).min(1).max(100), group_name: z.string().trim().min(1).max(120), adults_count: z.number().int().min(0).max(20), children_count: z.number().int().min(0).max(20) }),
  z.object({ intent: z.literal("update_guest"), id: z.string().uuid(), name: z.string().trim().min(1).max(180), group_name: z.string().trim().min(1).max(120), adults_count: z.number().int().min(0).max(20), children_count: z.number().int().min(0).max(20), status: z.enum(["pendente", "confirmado", "recusado"]) }),
  z.object({ intent: z.literal("update_rsvp"), id: z.string().uuid(), status: z.enum(["pendente", "confirmado", "recusado"]) }),
  z.object({ intent: z.literal("delete_guest"), id: z.string().uuid() }),
  z.object({ intent: z.literal("bulk_confirm"), ids: z.array(z.string().uuid()).min(1).max(200) }),
  z.object({ intent: z.literal("bulk_delete"), ids: z.array(z.string().uuid()).min(1).max(200) }),
  z.object({ intent: z.literal("approve_public_rsvp"), id: z.string().uuid() }),
  CreateInviteLinkActionSchema,
  RotateInviteLinkActionSchema,
]);

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserSession(request);
  const supabase = createServerAdminClient();
  const [{ data: guests, error: guestsError }, { data: activeInvites, error: invitesError }, { data: activeReservations, error: reservationsError }] = await Promise.all([
    supabase.from("guests").select("*,guest_event_rsvps(id,event_id,status,adult_limit,child_limit,confirmed_adults,confirmed_children,private_message,responded_at,celebration_events(title,starts_at))").order("name"),
    supabase
      .from("guest_invite_tokens")
      .select("guest_id,created_at,last_used_at")
      .is("revoked_at", null),
    supabase
      .from("gift_reservations")
      .select("id,guest_id,bridal_shower_gifts(item_name)")
      .eq("status", "active")
      .not("guest_id", "is", null),
  ]);
  if (guestsError || invitesError || reservationsError) {
    return Response.json({ error: "Não foi possível carregar os convidados." }, { status: 500, headers: noStoreHeaders() });
  }
  const invitesByGuest = new Map((activeInvites || []).map((invite) => [String(invite.guest_id), {
    active: true as const,
    created_at: String(invite.created_at),
    last_used_at: invite.last_used_at ? String(invite.last_used_at) : null,
  }]));
  const giftsByGuest = new Map<string, Array<{ id: string; item_name: string }>>();
  for (const reservation of activeReservations || []) {
    if (!reservation.guest_id) continue;
    const linkedGift = Array.isArray(reservation.bridal_shower_gifts) ? reservation.bridal_shower_gifts[0] : reservation.bridal_shower_gifts;
    const itemName = String(linkedGift?.item_name || "").trim();
    if (!itemName) continue;
    const guestId = String(reservation.guest_id);
    giftsByGuest.set(guestId, [...(giftsByGuest.get(guestId) || []), { id: String(reservation.id), item_name: itemName }]);
  }
  return Response.json({
    guests: (guests || []).map((guest) => {
      const { guest_event_rsvps: eventRows, contact_phone: contactPhone, ...guestFields } = guest;
      const eventResponses = (Array.isArray(eventRows) ? eventRows : []).map((response) => {
        const linkedEvent = Array.isArray(response.celebration_events) ? response.celebration_events[0] : response.celebration_events;
        return {
          id: String(response.id),
          event_id: String(response.event_id),
          event_title: String(linkedEvent?.title || "Celebração"),
          event_starts_at: linkedEvent?.starts_at ? String(linkedEvent.starts_at) : null,
          status: response.status,
          adult_limit: Number(response.adult_limit || 0),
          child_limit: Number(response.child_limit || 0),
          confirmed_adults: Number(response.confirmed_adults || 0),
          confirmed_children: Number(response.confirmed_children || 0),
          private_message: response.private_message ? String(response.private_message) : null,
          responded_at: response.responded_at ? String(response.responded_at) : null,
        };
      });
      return {
        ...guestFields,
        phone: contactPhone ? String(contactPhone).trim() : null,
        reserved_gifts: giftsByGuest.get(String(guest.id)) || [],
        event_responses: eventResponses,
        invite: invitesByGuest.get(String(guest.id)) || null,
      };
    }),
  }, { headers: noStoreHeaders() });
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

  const rotating = payload.intent === "rotate_invite_link";
  const { rawToken, tokenHash } = generateInviteToken();
  const now = new Date().toISOString();
  const { data: guest } = await supabase.from("guests").select("id").eq("id", payload.id).maybeSingle();
  if (!guest) return Response.json({ error: "Convidado não encontrado." }, { status: 404, headers: noStoreHeaders() });

  const { data: activeInvite, error: activeInviteError } = await supabase
    .from("guest_invite_tokens")
    .select("id,created_at,last_used_at")
    .eq("guest_id", payload.id)
    .is("revoked_at", null)
    .maybeSingle();
  if (activeInviteError) {
    return Response.json({ error: "Não foi possível verificar o convite atual." }, { status: 500, headers: noStoreHeaders() });
  }

  if (payload.intent === "approve_public_rsvp") {
    const { data, error } = await supabase.from("guests").update({ review_status: "approved" }).eq("id", payload.id).eq("source", "public_rsvp").select("id").maybeSingle();
    if (error) return Response.json({ error: "Não foi possível aprovar o cadastro." }, { status: 500, headers: noStoreHeaders() });
    if (!data) return Response.json({ error: "Cadastro novo não encontrado." }, { status: 404, headers: noStoreHeaders() });
    return Response.json({ success: true }, { headers: noStoreHeaders() });
  }
  if (!rotating && activeInvite) {
    return Response.json({ error: "Este convidado já possui um link ativo. Use a ação de gerar novo link." }, { status: 409, headers: noStoreHeaders() });
  }
  if (rotating && !activeInvite) {
    return Response.json({ error: "Este convidado ainda não possui um link ativo." }, { status: 409, headers: noStoreHeaders() });
  }

  const { error } = rotating
    ? await supabase.rpc("rotate_guest_invite_token", { p_guest_id: payload.id, p_token_hash: tokenHash })
    : await supabase.from("guest_invite_tokens").insert({ guest_id: payload.id, token_hash: tokenHash });
  if (error) {
    const conflict = error.code === "23505" || error.code === "P0002";
    return Response.json({ error: conflict ? "O convite ativo mudou. Atualize a tela antes de tentar novamente." : "Não foi possível gerar o convite." }, { status: conflict ? 409 : 500, headers: noStoreHeaders() });
  }
  const siteUrl = (process.env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  return Response.json({
    success: true,
    inviteUrl: `${siteUrl}/celebracao/convite/${rawToken}`,
    invite: { active: true, created_at: now, last_used_at: null },
  }, { headers: noStoreHeaders() });
}
