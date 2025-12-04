import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { NotificationCard } from "@/components/notification-card";
import type { Route } from "./+types/notifications";
import { useNotifications, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import type { Notification } from "@/schemas/notifications";

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

export default function Notifications() {
    const { notifications: initialNotifications } = useLoaderData<typeof loader>();
    const { data: notifications = [] } = useNotifications(initialNotifications as any);
    const markAllRead = useMarkAllNotificationsRead();

    const [filter, setFilter] = useState<"all" | "unread">("all");

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = notifications.filter(n => {
        if (filter === "unread") return !n.read;
        return true;
    });

    // Group notifications by date
    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const date = new Date(notification.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key = "Mais antigas";
        if (date.toDateString() === today.toDateString()) {
            key = "Hoje";
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = "Ontem";
        }

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(notification);
        return groups;
    }, {} as Record<string, Notification[]>);

    const groupOrder = ["Hoje", "Ontem", "Mais antigas"];

    return (
        <div className="min-h-screen bg-[#FDFCF8] pb-24">
            <div className="sticky top-0 z-20 bg-[#FDFCF8]/80 backdrop-blur-md border-b border-stone-100 px-4 py-4">
                <div className="flex items-center justify-end mb-4">
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => markAllRead.mutate()}
                            disabled={markAllRead.isPending}
                        >
                            <Check className="h-3 w-3 mr-1" /> Marcar tudo como lido
                        </Button>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                        className={`rounded-full text-xs h-8 px-4 ${filter === "all" ? "bg-stone-900 text-white hover:bg-stone-800" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                    >
                        Todas
                    </Button>
                    <Button
                        variant={filter === "unread" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("unread")}
                        className={`rounded-full text-xs h-8 px-4 relative ${filter === "unread" ? "bg-stone-900 text-white hover:bg-stone-800" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                    >
                        Não lidas
                        {unreadCount > 0 && (
                            <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            <div className="px-4 py-6 space-y-8">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Bell className="h-10 w-10 text-stone-300" />
                        </div>
                        <h3 className="text-lg font-medium text-stone-800 mb-2">Tudo limpo por aqui!</h3>
                        <p className="text-stone-500 max-w-xs mx-auto text-sm leading-relaxed">
                            Você leu todas as suas notificações. Avisaremos quando houver novidades.
                        </p>
                    </div>
                ) : (
                    groupOrder.map(group => {
                        const notificationsInGroup = groupedNotifications[group];
                        if (!notificationsInGroup || notificationsInGroup.length === 0) return null;

                        return (
                            <div key={group} className="space-y-4">
                                <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wider px-1">{group}</h2>
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {notificationsInGroup.map((notification: Notification) => (
                                            <NotificationCard key={notification.id} notification={notification} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
