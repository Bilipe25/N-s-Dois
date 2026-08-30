import webpush, { type PushSubscription } from "web-push";
import { createServerAdminClient } from "@/lib/supabase.server";

type StoredPushSubscription = {
    id: string;
    subscription: PushSubscription;
};

export async function sendPushToUser(
    request: Request,
    userName: string,
    title: string,
    body: string,
    url: string = "/",
    image?: string
) {
    void request;

    const vapidSubject = process.env.VAPID_SUBJECT;
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
        return { error: "Push service is not configured" };
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = createServerAdminClient();

    let subscriptionsQuery = supabase
        .from("push_subscriptions")
        .select("id, subscription");
    if (userName !== "all") {
        subscriptionsQuery = subscriptionsQuery.eq("user_name", userName);
    }

    const [{ data: subscriptions, error }, { data: appConfig }] = await Promise.all([
        subscriptionsQuery,
        supabase.from("app_config").select("logo_url").limit(1).maybeSingle(),
    ]);
    if (error) {
        console.error("Falha ao carregar destinatários de push:", error.message);
        return { error: "Push delivery failed" };
    }

    const payload = JSON.stringify({
        title,
        body,
        url,
        image,
        icon: appConfig?.logo_url || "/favicon.ico",
    });

    const results = await Promise.all(
        ((subscriptions ?? []) as StoredPushSubscription[]).map(async (entry) => {
            try {
                await webpush.sendNotification(entry.subscription, payload);
                return { success: true };
            } catch (caught) {
                const statusCode =
                    typeof caught === "object" && caught && "statusCode" in caught
                        ? Number(caught.statusCode)
                        : 0;
                if (statusCode === 404 || statusCode === 410) {
                    await supabase.from("push_subscriptions").delete().eq("id", entry.id);
                }
                return { success: false };
            }
        })
    );

    return { success: true, results };
}
