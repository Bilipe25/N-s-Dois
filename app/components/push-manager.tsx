import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PushManager() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        } else {
            setIsLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error("Erro ao verificar subscrição:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const subscribe = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = (window as any).ENV?.VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                toast.error("Chave pública de notificações não configurada.");
                setIsLoading(false);
                return;
            }

            // Verificar permissão
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    toast.error("Permissão de notificação negada.");
                    setIsLoading(false);
                    return;
                }
            }

            if (Notification.permission !== 'granted') {
                toast.error("Permissão de notificação negada.");
                setIsLoading(false);
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Enviar para o backend
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subscription }),
            });

            if (response.ok) {
                setIsSubscribed(true);
                toast.success("Notificações ativadas neste dispositivo!");
            } else {
                throw new Error("Falha ao salvar subscrição no servidor.");
            }

        } catch (error) {
            console.error("Erro ao inscrever:", error);
            toast.error("Erro ao ativar notificações.");
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                // Opcional: Avisar backend para remover (mas o backend já trata 410)
                setIsSubscribed(false);
                toast.success("Notificações desativadas.");
            }
        } catch (error) {
            console.error("Erro ao desinscrever:", error);
            toast.error("Erro ao desativar notificações.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) return null;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isSubscribed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                        {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Notificações Push</span>
                        <span className="text-xs text-muted-foreground">
                            {isSubscribed
                                ? "Ativo neste dispositivo"
                                : "Receba alertas sobre presentes e novidades"}
                        </span>
                    </div>
                </div>
                <Button
                    variant={isSubscribed ? "outline" : "default"}
                    size="sm"
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={isLoading}
                    className={isSubscribed ? "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" : ""}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSubscribed ? (
                        "Desativar"
                    ) : (
                        "Ativar"
                    )}
                </Button>
            </div>
        </div>
    );
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
