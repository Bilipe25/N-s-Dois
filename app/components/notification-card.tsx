import { motion, useAnimation, type PanInfo } from "framer-motion";
import { useFetcher, Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Gift, Users, Check, ExternalLink, Trash2, DollarSign, MailOpen, X } from "lucide-react";
import { memo, useState, useEffect } from "react";

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    link?: string;
    image_url?: string;
}

interface NotificationCardProps {
    notification: Notification;
}

const getIcon = (type: string) => {
    switch (type) {
        case "gift": return <Gift className="h-5 w-5 text-pink-500" />;
        case "rsvp": return <Users className="h-5 w-5 text-blue-500" />;
        case "task": return <Check className="h-5 w-5 text-green-500" />;
        case "budget": return <DollarSign className="h-5 w-5 text-yellow-500" />;
        default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
};

export const NotificationCard = memo(({ notification }: NotificationCardProps) => {
    const fetcher = useFetcher();
    const controls = useAnimation();
    const [isVisible, setIsVisible] = useState(true);
    const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

    // Optimistic UI state
    const isRead = fetcher.formData?.get("intent") === "mark_read" ? true : notification.read;
    const isDeleting = fetcher.formData?.get("intent") === "delete";

    useEffect(() => {
        if (isDeleting) {
            setIsVisible(false);
        }
    }, [isDeleting]);

    const handleDrag = (event: any, info: PanInfo) => {
        if (info.offset.x > 50) {
            setSwipeDirection("right");
        } else if (info.offset.x < -50) {
            setSwipeDirection("left");
        } else {
            setSwipeDirection(null);
        }
    };

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const threshold = 100; // Pixels to trigger action

        if (info.offset.x > threshold && !isRead) {
            // Swipe Right -> Mark Read
            fetcher.submit(
                { intent: "mark_read", id: notification.id },
                { method: "post" }
            );
            await controls.start({ x: 0 }); // Reset position
        } else if (info.offset.x < -threshold) {
            // Swipe Left -> Delete
            setIsVisible(false); // Optimistic hide
            // Wait for animation to finish before submitting
            setTimeout(() => {
                fetcher.submit(
                    { intent: "delete", id: notification.id },
                    { method: "post" }
                );
            }, 300);
        } else {
            // Reset if not enough swipe
            controls.start({ x: 0 });
            setSwipeDirection(null);
        }
    };

    if (!isVisible) return null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="relative touch-pan-y mb-3" // Important for mobile scrolling
        >
            {/* Background Actions */}
            <div className={`absolute inset-0 flex items-center justify-between px-6 rounded-xl overflow-hidden transition-colors duration-300 ${swipeDirection === "right" ? "bg-green-100" : swipeDirection === "left" ? "bg-red-100" : "bg-transparent"
                }`}>
                <div className={`flex items-center gap-2 text-green-700 font-medium transition-opacity duration-300 ${swipeDirection === "right" ? "opacity-100" : "opacity-30"}`}>
                    <MailOpen className="h-5 w-5" />
                    <span className="text-sm">Marcar como lida</span>
                </div>
                <div className={`flex items-center gap-2 text-red-700 font-medium transition-opacity duration-300 ${swipeDirection === "left" ? "opacity-100" : "opacity-30"}`}>
                    <span className="text-sm">Excluir</span>
                    <Trash2 className="h-5 w-5" />
                </div>
            </div>

            {/* Swipeable Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }} // Snap back
                dragElastic={0.7}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x: 0 }}
                className="relative bg-background rounded-xl shadow-sm z-10"
            >
                <Card className={`transition-all border-none shadow-md ${!isRead ? 'bg-white ring-1 ring-rose-100' : 'bg-stone-50 opacity-80'}`}>
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className={`p-2.5 rounded-full shrink-0 transition-colors ${!isRead ? 'bg-rose-50 text-rose-500' : 'bg-stone-200 text-stone-500'}`}>
                            {getIcon(notification.type)}
                        </div>

                        <div className="flex-1 space-y-1.5 min-w-0 select-none"> {/* select-none prevents text selection while dragging */}
                            <div className="flex justify-between items-start gap-2">
                                <h3 className={`font-semibold text-sm truncate ${!isRead ? 'text-stone-900' : 'text-stone-600'}`}>
                                    {notification.title}
                                </h3>
                                <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0 font-medium">
                                    {new Date(notification.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {new Date(notification.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <p className="text-sm text-stone-600 leading-relaxed break-words line-clamp-2">
                                {notification.message}
                            </p>

                            {notification.image_url && (
                                <div className="pt-2">
                                    <img
                                        src={notification.image_url}
                                        alt="Preview"
                                        className="h-20 w-full object-cover rounded-lg border border-stone-100 pointer-events-none" // pointer-events-none prevents image drag
                                    />
                                </div>
                            )}

                            {notification.link && (
                                <div className="pt-2 flex justify-end">
                                    <Button variant="ghost" size="sm" className="h-auto p-0 text-rose-500 hover:text-rose-700 text-xs font-medium hover:bg-transparent" asChild>
                                        <Link to={notification.link} className="flex items-center gap-1">
                                            Ver detalhes <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
});
