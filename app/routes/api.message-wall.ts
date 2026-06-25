import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { MessageWallSchema } from "@/schemas/bridal-shower";
import { sendPushToUser } from "@/services/push.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const supabase = createClient(request);
    const { data: messages, error } = await supabase
        .from("message_wall")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ messages });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const method = request.method;
    const supabase = createClient(request);

    if (method === "POST") {
        try {
            const jsonData = await request.json();
            const parsedData = MessageWallSchema.parse(jsonData);

            const { data: inserted, error: insertError } = await supabase
                .from("message_wall")
                .insert({
                    author_name: parsedData.author_name,
                    message: parsedData.message
                })
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            // Send notification for mural message
            try {
                const notifMessage = `${parsedData.author_name} deixou uma mensagem no mural: "${parsedData.message.substring(0, 50)}${parsedData.message.length > 50 ? "..." : ""}"`;

                await supabase.from("notifications").insert({
                    type: "guest",
                    title: "Nova mensagem no mural! 📝",
                    message: notifMessage,
                    link: "/bridal-shower"
                });

                await sendPushToUser(
                    request,
                    "all",
                    "Nova mensagem no mural! 📝",
                    notifMessage,
                    "/bridal-shower"
                );
            } catch (notifError) {
                console.error("Error sending notification for mural message:", notifError);
            }

            return Response.json({ success: true, message: inserted });

        } catch (error: any) {
            console.error("Error in message wall POST action:", error);
            return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
        }
    }

    if (method === "DELETE") {
        const session = await getSession(request.headers.get("Cookie"));
        const isAdmin = Boolean(session.get("user"));

        if (!isAdmin) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const url = new URL(request.url);
            const id = url.searchParams.get("id");

            if (!id) {
                return Response.json({ error: "ID required" }, { status: 400 });
            }

            const { error: deleteError } = await supabase
                .from("message_wall")
                .delete()
                .eq("id", id);

            if (deleteError) {
                throw deleteError;
            }

            return Response.json({ success: true });

        } catch (error: any) {
            console.error("Error in message wall DELETE action:", error);
            return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
        }
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
};
