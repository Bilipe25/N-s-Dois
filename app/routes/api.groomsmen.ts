import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";
import { z } from "zod";
import { sendPushToUser } from "@/services/push.server";

const ActionSchema = z.discriminatedUnion("intent", [
    z.object({
        intent: z.literal("create"),
        name: z.string(),
        role: z.string(),
        side: z.string(),
        photoUrl: z.string().nullable().optional(),
        user: z.string().optional(),
    }),
    z.object({
        intent: z.literal("update"),
        id: z.string().uuid(),
        name: z.string(),
        role: z.string(),
        side: z.string(),
        photoUrl: z.string().nullable().optional(),
    }),
    z.object({
        intent: z.literal("delete"),
        id: z.string().uuid(),
    }),
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const supabase = createClient(request);
    const { data, error } = await supabase
        .from("groomsmen")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        throw new Response("Error fetching groomsmen", { status: 500 });
    }

    return Response.json({ groomsmen: data });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    if (request.method !== "POST" && request.method !== "DELETE" && request.method !== "PUT") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const jsonData = await request.json();
        const payload = ActionSchema.parse(jsonData);
        const supabase = createClient(request);

        if (payload.intent === "create") {
            const { name, role, side, photoUrl, user } = payload;

            const { data, error } = await supabase.from("groomsmen").insert({
                name,
                role,
                side,
                photo_url: photoUrl
            }).select().single();

            if (error) throw error;

            // Notification
            if (user) {
                try {
                    const title = "Novo Padrinho/Madrinha ✨";
                    const message = `${user} adicionou ${name} como ${role} (${side === 'noivo' ? 'Noivo' : 'Noiva'}).`;
                    const link = "/groomsmen";

                    await supabase.from("notifications").insert({
                        type: "rsvp",
                        title,
                        message,
                        link,
                        image_url: photoUrl
                    });

                    await sendPushToUser(request, "all", title, message, link);
                } catch (notifError) {
                    console.error("Error sending notification (non-fatal):", notifError);
                }
            }

            return Response.json({ success: true, data });
        }

        if (payload.intent === "update") {
            const { id, name, role, side, photoUrl } = payload;

            const updates: any = { name, role, side };
            if (photoUrl !== undefined) updates.photo_url = photoUrl;

            const { data, error } = await supabase
                .from("groomsmen")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            return Response.json({ success: true, data });
        }

        if (payload.intent === "delete") {
            const { id } = payload;
            const { error } = await supabase.from("groomsmen").delete().eq("id", id);
            if (error) throw error;
            return Response.json({ success: true });
        }

        return Response.json({ error: "Invalid intent" }, { status: 400 });

    } catch (error: any) {
        console.error("Error in api.groomsmen:", error);
        if (error instanceof z.ZodError) {
            return Response.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
        }
        return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
};
