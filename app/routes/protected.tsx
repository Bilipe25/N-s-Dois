import { Outlet, redirect, useLoaderData, useLocation, useNavigation } from "react-router";
import { useState } from "react";
import { getSession } from "@/sessions";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
import { Skeleton } from "@/components/ui/skeleton";
import type { Route } from "./+types/protected";

import { createClient, hasSupabaseEnv } from "@/lib/supabase";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        throw redirect("/login");
    }

    if (!hasSupabaseEnv()) {
        return { user, pendingTasksCount: 0, unreadNotificationsCount: 0 };
    }

    try {
        const supabase = createClient(request);
        const { count: pendingTasksCount } = await supabase
            .from("checklist_items")
            .select("*", { count: "exact", head: true })
            .eq("status", "pendente");

        const { count: unreadNotificationsCount } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("read", false);

        return { user, pendingTasksCount: pendingTasksCount || 0, unreadNotificationsCount: unreadNotificationsCount || 0 };
    } catch (error) {
        console.error("Erro ao carregar contadores da área privada:", error);
        return { user, pendingTasksCount: 0, unreadNotificationsCount: 0 };
    }
};

function PageSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="grid gap-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        </div>
    );
}

export default function ProtectedLayout() {
    const { pendingTasksCount, unreadNotificationsCount } = useLoaderData<typeof loader>();
    const location = useLocation();
    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";
    const [headerAction, setHeaderAction] = useState<React.ReactNode>(null);

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <TopNav unreadCount={unreadNotificationsCount} action={headerAction} />
            <main className="pb-24 pt-16 px-4">
                {isLoading ? (
                    <PageSkeleton />
                ) : (
                    <div
                        key={location.pathname}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        <Outlet context={{ setHeaderAction }} />
                    </div>
                )}
            </main>
            <BottomNav pendingTasksCount={pendingTasksCount} />
        </div>
    );
}
