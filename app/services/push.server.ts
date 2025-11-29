import webpush from "web-push";
import { createClient } from "@/lib/supabase";

// Configuração VAPID
// Em produção, use variáveis de ambiente!
const vapidKeys = {
    publicKey: "BDjSK0SYyg0Xbsm03PlBGc8jawmjKeEYVVUn8ZB54Okdq3uUlec5RZGYjRMimMfEtvGg4IMitpYBvWIrC1WMuCw",
    privateKey: "1pMTd6isk9fb8tY1ROqIDUqohFXpQ5cXjLm0z2O-SCQ"
};

webpush.setVapidDetails(
    "mailto:gabriel@example.com", // Substitua por um email real se possível
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export async function sendPushToUser(request: Request, userName: string, title: string, body: string, url: string = "/") {
    const supabase = createClient(request);

    // Buscar subscrições do usuário
    const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_name", userName);

    if (error || !subscriptions) {
        console.error("Erro ao buscar subscrições:", error);
        return;
    }

    const payload = JSON.stringify({ title, body, url });

    const promises = subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification(sub.subscription, payload);
        } catch (error: any) {
            console.error("Erro ao enviar push:", error);

            // Se a subscrição for inválida (410 Gone), remover do banco
            if (error.statusCode === 410) {
                await supabase
                    .from("push_subscriptions")
                    .delete()
                    .match({ subscription: sub.subscription }); // Isso pode ser tricky com JSONB, ideal ter ID
            }
        }
    });

    await Promise.all(promises);
}
