import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { DashboardData } from "@/schemas/dashboard";

const getSupabase = () => createClient();

export const useDashboard = () => {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: async (): Promise<DashboardData> => {
            const supabase = getSupabase();
            const [
                configResponse,
                pendingTasksResponse,
                totalTasksResponse,
                guestsResponse,
                budgetResponse,
                nextTaskResponse
            ] = await Promise.all([
                // 1. Config
                supabase.from("app_config").select("*").single(),

                // 2. Pending Tasks
                supabase.from("checklist_items").select("*", { count: "exact", head: true }).eq("status", "pendente"),

                // 3. Total Tasks
                supabase.from("checklist_items").select("*", { count: "exact", head: true }),

                // 4. Guests
                supabase.from("guests").select("adults_count, children_count, rsvp_status"),

                // 5. Budget
                supabase.from("budget_items").select("paid_value, estimated_value"),

                // 6. Next Task
                supabase.from("checklist_items")
                    .select("title")
                    .eq("status", "pendente")
                    .order("created_at", { ascending: true })
                    .limit(1)
                    .single()
            ]);

            // Process Guests
            const allGuests = guestsResponse.data || [];
            const confirmedGuestsCount = allGuests
                .filter(g => g.rsvp_status === "confirmado")
                .reduce((acc, guest) => acc + (guest.adults_count || 0) + (guest.children_count || 0), 0);

            const totalGuestsCount = allGuests
                .reduce((acc, guest) => acc + (guest.adults_count || 0) + (guest.children_count || 0), 0);

            // Process Budget
            const budgetItems = budgetResponse.data || [];
            const totalPaid = budgetItems.reduce((acc, item) => acc + (Number(item.paid_value) || 0), 0);
            const totalEstimated = budgetItems.reduce((acc, item) => acc + (Number(item.estimated_value) || 0), 0);

            return {
                config: configResponse.data,
                tasks: {
                    pending: pendingTasksResponse.count || 0,
                    total: totalTasksResponse.count || 0
                },
                guests: {
                    confirmed: confirmedGuestsCount,
                    total: totalGuestsCount
                },
                budget: {
                    paid: totalPaid,
                    estimated: totalEstimated
                },
                nextTask: nextTaskResponse.data
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
