import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { PixConfirmationSchema } from "@/schemas/bridal-shower";
import { sendPushToUser } from "@/services/push.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const isAdmin = Boolean(session.get("user"));

    if (!isAdmin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(request);
    const { data: confirmations, error } = await supabase
        .from("pix_confirmations")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ confirmations });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const jsonData = await request.json();
        const parsedData = PixConfirmationSchema.parse(jsonData);

        const supabase = createClient(request);

        const { data: inserted, error: insertError } = await supabase
            .from("pix_confirmations")
            .insert({
                sender_name: parsedData.sender_name,
                message: parsedData.message || null,
                amount: parsedData.amount,
                gift_id: parsedData.gift_id || null,
                gift_name: parsedData.gift_name || null
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        // Send notification
        try {
            const giftSuffix = parsedData.gift_name ? ` para o presente "${parsedData.gift_name}"` : "";
            const notifMessage = `${parsedData.sender_name} enviou R$ ${parsedData.amount.toFixed(2)}${giftSuffix}.`;

            await supabase.from("notifications").insert({
                type: "gift",
                title: "Novo PIX Confirmado! 💰",
                message: notifMessage,
                link: "/bridal-shower"
            });

            await sendPushToUser(
                request,
                "all",
                "Novo PIX Confirmado! 💰",
                notifMessage,
                "/bridal-shower"
            );
        } catch (notifError) {
            console.error("Error sending notification for PIX confirmation:", notifError);
        }

        return Response.json({ success: true, confirmation: inserted });

    } catch (error: any) {
        console.error("Error in PIX confirmation action:", error);
        return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
};
