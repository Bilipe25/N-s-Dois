import { Outlet, redirect } from "react-router";
import { getSession } from "@/sessions";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
import type { Route } from "./+types/protected";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        throw redirect("/login");
    }

    return { user };
};

export default function ProtectedLayout() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <TopNav />
            <main className="pb-24 pt-16 px-4">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
