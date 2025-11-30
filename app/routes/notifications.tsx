import { useState } from "react";
import { useLoaderData, Form, useSubmit, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Gift, Users, Check, ExternalLink, Trash2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";
import { NotificationCard } from "@/components/notification-card";
import type { Route } from "./+types/notifications";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Notificações - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const supabase = createClient(request);

    const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

    return { notifications: notifications || [] };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "mark_all_read") {
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("read", false);
    } else if (intent === "mark_read") {
        const id = formData.get("id") as string;
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", id);
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase
            .from("notifications")
            .delete()
            .eq("id", id);
    }

    return null;
};

export default function Notifications() {
    const { notifications } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

    const getIcon = (type: string) => {
        switch (type) {
            case "gift": return <Gift className="h-5 w-5 text-pink-500" />;
            case "rsvp": return <Users className="h-5 w-5 text-blue-500" />;
            case "task": return <Check className="h-5 w-5 text-green-500" />;
            case "budget": return <DollarSign className="h-5 w-5 text-yellow-500" />;
            default: return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = notifications.filter(n => {
        if (filter === "unread") return !n.read;
        if (filter === "read") return n.read;
        return true;
    });

    return (
        <div className="space-y-6 pb-20">
            {/* Header removed to avoid duplication with TopNav */}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                        className="rounded-full text-xs h-8"
                    >
                        Todas
                    </Button>
                    <Button
                        variant={filter === "unread" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("unread")}
                        className="rounded-full text-xs h-8 relative"
                    >
                        Não lidas
                        {unreadCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </div>

                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Form method="post">
                            <input type="hidden" name="intent" value="mark_all_read" />
                            <Button type="submit" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                                <Check className="h-3 w-3 mr-1" /> Marcar tudo como lido
                            </Button>
                        </Form>
                    )}
                </div>
            </div>

            {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma notificação encontrada.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.map((notification) => (
                            <NotificationCard key={notification.id} notification={notification} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
