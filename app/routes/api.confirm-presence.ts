import type { ActionFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";
import { ConfirmPresenceSchema } from "@/schemas/bridal-shower";
import { sendPushToUser } from "@/services/push.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const jsonData = await request.json();
        const { name, confirmed_location } = ConfirmPresenceSchema.parse(jsonData);

        const supabase = createClient(request);

        // Check if guest exists
        const { data: existingGuest } = await supabase
            .from("bridal_shower_guests")
            .select("id")
            .ilike("name", name)
            .single();

        if (existingGuest) {
            // Update existing guest
            const { error } = await supabase.from("bridal_shower_guests").update({
                confirmed: true,
                confirmed_location
            }).eq("id", existingGuest.id);

            if (error) throw error;
        } else {
            // Create new guest
            const { error } = await supabase.from("bridal_shower_guests").insert({
                name,
                confirmed: true,
                confirmed_location
            });

            if (error) throw error;
        }

        // Send Notifications
        try {
            await supabase.from("notifications").insert({
                type: "guest",
                title: "Presença Confirmada! ✅",
                message: `${name} confirmou presença no Chá de Casa Nova (${confirmed_location === 'local1' ? 'Local 1' : 'Local 2'}).`,
                link: "/bridal-shower"
            });

            await sendPushToUser(request, "all", "Presença Confirmada! ✅", `${name} confirmou presença no Chá de Casa Nova.`, "/bridal-shower");
        } catch (notifError) {
            console.error("Error sending notification for guest confirmation (non-fatal):", notifError);
        }

        return Response.json({ success: true });

    } catch (error: any) {
        console.error("Error confirming presence:", error);
        return Response.json({ error: error.message || "Erro ao confirmar presença." }, { status: 500 });
    }
};
