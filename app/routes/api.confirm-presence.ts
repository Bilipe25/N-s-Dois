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

        // Fetch config to get location names
        const { data: configData } = await supabase
            .from("app_config")
            .select("bridal_shower_location, bridal_shower_location_2")
            .single();

        const locationName = confirmed_location === 'local1'
            ? (configData?.bridal_shower_location || 'Local 1')
            : (configData?.bridal_shower_location_2 || 'Local 2');

        // Check if guest exists (case-insensitive search)
        const { data: existingGuest } = await supabase
            .from("bridal_shower_guests")
            .select("id, name")
            .ilike("name", name)
            .single();

        let isNewGuest = false;
        let guestDisplayName = name;

        if (existingGuest) {
            // Update existing guest
            guestDisplayName = existingGuest.name; // Use the name as stored in DB for consistency
            const { error } = await supabase.from("bridal_shower_guests").update({
                confirmed: true,
                confirmed_location
            }).eq("id", existingGuest.id);

            if (error) throw error;
        } else {
            // Create new guest
            isNewGuest = true;
            const { error } = await supabase.from("bridal_shower_guests").insert({
                name,
                confirmed: true,
                confirmed_location
            });

            if (error) throw error;
        }

        // Send Notifications with location name
        try {
            await supabase.from("notifications").insert({
                type: "guest",
                title: "Presença Confirmada! ✅",
                message: `${guestDisplayName} confirmou presença no Chá de Casa Nova em ${locationName}.`,
                link: "/bridal-shower"
            });

            await sendPushToUser(
                request,
                "all",
                "Presença Confirmada! ✅",
                `${guestDisplayName} confirmou presença no Chá de Casa Nova em ${locationName}.`,
                "/bridal-shower"
            );
        } catch (notifError) {
            console.error("Error sending notification for guest confirmation (non-fatal):", notifError);
        }

        return Response.json({
            success: true,
            guestName: guestDisplayName,
            locationName,
            isNewGuest
        });

    } catch (error: any) {
        console.error("Error confirming presence:", error);
        return Response.json({ error: error.message || "Erro ao confirmar presença." }, { status: 500 });
    }
};
