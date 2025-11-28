import { useState } from "react";
import { useLoaderData, Form, useSubmit, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Gift, Users, Check, ExternalLink, Trash2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
                    {filteredNotifications.map((notification) => (
                        <Card key={notification.id} className={`transition-all ${!notification.read ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-80 hover:opacity-100'}`}>
                            <CardContent className="p-4 flex gap-4 items-start">
                                <div className={`p-2 rounded-full shrink-0 ${!notification.read ? 'bg-background shadow-sm' : 'bg-muted'}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className={`font-medium text-sm truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                            {new Date(notification.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-snug break-words">
                                        {notification.message}
                                    </p>
                                    {notification.link && (
                                        <div className="pt-2">
                                            <Button variant="link" size="sm" className="h-auto p-0 text-primary text-xs" asChild>
                                                <Link to={notification.link} className="flex items-center gap-1">
                                                    Ver detalhes <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    {!notification.read && (
                                        <Form method="post">
                                            <input type="hidden" name="intent" value="mark_read" />
                                            <input type="hidden" name="id" value={notification.id} />
                                            <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" title="Marcar como lida">
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        </Form>
                                    )}
                                    <Form method="post">
                                        <input type="hidden" name="intent" value="delete" />
                                        <input type="hidden" name="id" value={notification.id} />
                                        <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" title="Excluir">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </Form>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
