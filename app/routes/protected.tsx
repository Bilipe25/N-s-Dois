import { Outlet, redirect, useLoaderData } from "react-router";
import { getSession } from "@/sessions";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
import type { Route } from "./+types/protected";

import { createClient } from "@/lib/supabase";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        throw redirect("/login");
    }

    const supabase = createClient(request);
    const { count: pendingTasksCount } = await supabase
        .from("checklist_items")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");

    return { user, pendingTasksCount: pendingTasksCount || 0 };
};

export default function ProtectedLayout() {
    const { pendingTasksCount } = useLoaderData<typeof loader>();
    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <TopNav />
            <main className="pb-24 pt-16 px-4">
                <Outlet />
            </main>
            <BottomNav pendingTasksCount={pendingTasksCount} />
        </div>
    );
}
