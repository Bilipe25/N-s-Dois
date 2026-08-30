import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/schemas/dashboard";

export const useDashboard = () => {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: async (): Promise<DashboardData> => {
            const response = await fetch("/api/dashboard", { headers: { Accept: "application/json" } });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Dashboard indisponível.");
            return payload as DashboardData;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
