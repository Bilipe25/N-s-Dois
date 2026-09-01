import type { LoaderFunctionArgs } from "react-router";
import { noStoreHeaders } from "@/lib/security.server";
import { createServerAdminClient } from "@/lib/supabase.server";
import { requireUserSession } from "@/sessions";
import { confirmedCounts } from "@/lib/guest-rsvp";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserSession(request);
  const supabase = createServerAdminClient();
  const [config, pendingTasks, totalTasks, guests, budget, nextTask] = await Promise.all([
    supabase.from("app_config").select("id,wedding_date,home_photo_url,logo_url,created_at").limit(1).maybeSingle(),
    supabase.from("checklist_items").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("checklist_items").select("id", { count: "exact", head: true }),
    supabase.from("guests").select("adults_count,children_count,rsvp_status,rsvp_adults,rsvp_children"),
    supabase.from("budget_items").select("paid_value,estimated_value"),
    supabase.from("checklist_items").select("title").eq("status", "pendente").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  const failed = [config, pendingTasks, totalTasks, guests, budget, nextTask].find((result) => result.error);
  if (failed?.error) {
    console.error("Falha ao montar dashboard:", failed.error.code);
    return Response.json({ error: "Dashboard indisponível." }, { status: 500, headers: noStoreHeaders() });
  }

  const guestRows = guests.data ?? [];
  const invitedPeople = guestRows.reduce((sum, guest) => sum + (guest.adults_count ?? 0) + (guest.children_count ?? 0), 0);
  const confirmedPeople = guestRows
    .filter((guest) => guest.rsvp_status === "confirmado")
    .reduce((sum, guest) => { const counts = confirmedCounts(guest); return sum + counts.adults + counts.children; }, 0);
  const budgetRows = budget.data ?? [];

  return Response.json({
    config: config.data,
    tasks: { pending: pendingTasks.count ?? 0, total: totalTasks.count ?? 0 },
    guests: { confirmed: confirmedPeople, total: invitedPeople },
    budget: {
      paid: budgetRows.reduce((sum, item) => sum + (Number(item.paid_value) || 0), 0),
      estimated: budgetRows.reduce((sum, item) => sum + (Number(item.estimated_value) || 0), 0),
    },
    nextTask: nextTask.data,
  }, { headers: noStoreHeaders() });
}
