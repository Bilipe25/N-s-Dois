import type { ActionFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";
import { sendPushToUser } from "@/services/push.server";
import { z } from "zod";

const ActionSchema = z.discriminatedUnion("intent", [
    z.object({
        intent: z.literal("toggle_like"),
        inspirationId: z.string().uuid(),
        hasLiked: z.boolean(),
        user: z.string(),
    }),
    z.object({
        intent: z.literal("add_comment"),
        inspirationId: z.string().uuid(),
        content: z.string().min(1),
        user: z.string(),
    }),
    z.object({
        intent: z.literal("add_inspiration"),
        title: z.string(),
        category: z.string(),
        user: z.string(),
        inspirationId: z.string().uuid(), // ID of the newly created inspiration
        photoUrl: z.string().url(),
    }),
]);

export const action = async ({ request }: ActionFunctionArgs) => {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const jsonData = await request.json();
        const payload = ActionSchema.parse(jsonData);
        const supabase = createClient(request);

        if (payload.intent === "toggle_like") {
            const { inspirationId, hasLiked, user } = payload;

            if (hasLiked) {
                const { error } = await supabase.from("inspiration_likes")
                    .delete()
                    .match({ inspiration_id: inspirationId, user_name: user });
                if (error) throw error;
            } else {
                const { error } = await supabase.from("inspiration_likes").insert({
                    inspiration_id: inspirationId,
                    user_name: user
                });
                if (error) throw error;

                // Notification
                const { data: insp } = await supabase.from("inspirations").select("title, photo_url").eq("id", inspirationId).single();
                if (insp) {
                    const title = "Nova Curtida ❤️";
                    const message = `${user} curtiu sua inspiração "${insp.title}".`;
                    const link = `/inspirations?id=${inspirationId}`;

                    await supabase.from("notifications").insert({
                        type: "gift",
                        title,
                        message,
                        link,
                        image_url: insp.photo_url
                    });

                    await sendPushToUser(request, "all", title, message, link);
                }
            }
            return Response.json({ success: true });
        }

        if (payload.intent === "add_comment") {
            const { inspirationId, content, user } = payload;

            const { data, error } = await supabase.from("inspiration_comments").insert({
                inspiration_id: inspirationId,
                user_name: user,
                content
            }).select().single();

            if (error) throw error;

            // Notification
            const { data: insp } = await supabase.from("inspirations").select("title, photo_url").eq("id", inspirationId).single();
            if (insp) {
                const title = "Novo Comentário 💬";
                const message = `${user} comentou em "${insp.title}": "${content}"`;
                const link = `/inspirations?id=${inspirationId}`;

                await supabase.from("notifications").insert({
                    type: "gift",
                    title,
                    message,
                    link,
                    image_url: insp.photo_url
                });

                await sendPushToUser(request, "all", title, message, link);
            }
            return Response.json({ success: true, data });
        }

        if (payload.intent === "add_inspiration") {
            const { title, category, user, inspirationId, photoUrl } = payload;

            // Notification only (DB insertion happens on client for file upload simplicity, or we could move it here but file upload is complex)
            // Ideally we should move the DB insertion here too, but the hook handles file upload + DB insert. 
            // Let's just handle the notification here for now to avoid refactoring the whole upload flow.

            const notifTitle = "Nova Inspiração ✨";
            const message = `${user} adicionou uma nova inspiração em ${category}: "${title}".`;
            const link = `/inspirations?id=${inspirationId}`;

            await supabase.from("notifications").insert({
                type: "gift",
                title: notifTitle,
                message,
                link,
                image_url: photoUrl
            });

            await sendPushToUser(request, "all", notifTitle, message, link);

            return Response.json({ success: true });
        }

        return Response.json({ error: "Invalid intent" }, { status: 400 });

    } catch (error: any) {
        console.error("Error in api.inspirations:", error);

        if (error instanceof z.ZodError) {
            return Response.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
        }

        return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
};
