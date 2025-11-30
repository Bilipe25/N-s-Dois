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

            // Obter chave pública do ambiente
            const vapidPublicKey = (window as any).ENV.VAPID_PUBLIC_KEY;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidPublicKey
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
        <div className="flex items-center gap-2">
            <Button
                variant={isSubscribed ? "outline" : "default"}
                size="sm"
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={isLoading}
                className={isSubscribed ? "border-green-500 text-green-600 hover:text-green-700 hover:bg-green-50" : ""}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isSubscribed ? (
                    <Bell className="h-4 w-4 mr-2" />
                ) : (
                    <BellOff className="h-4 w-4 mr-2" />
                )}
                {isSubscribed ? "Notificações Ativas" : "Ativar Notificações"}
            </Button>
        </div>
    );
}
