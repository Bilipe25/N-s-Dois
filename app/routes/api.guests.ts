import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";
import { sendPushToUser } from "@/services/push.server";
import { requireUserSession } from "@/sessions";
import { z } from "zod";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createClient(request);

    const { data: guests, error } = await supabase
        .from("guests")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ guests: guests || [] });
};

const ActionSchema = z.discriminatedUnion("intent", [
    z.object({
        intent: z.literal("add_guest"),
        names: z.array(z.string()),
        group_name: z.string(),
        user: z.string(),
    }),
    z.object({
        intent: z.literal("update_rsvp"),
        id: z.string().uuid(),
        status: z.enum(["pendente", "confirmado", "recusado"]),
    }),
]);

export const action = async ({ request }: ActionFunctionArgs) => {
    await requireUserSession(request);

    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const jsonData = await request.json();
        const payload = ActionSchema.parse(jsonData);
        const supabase = createClient(request);

        if (payload.intent === "add_guest") {
            const { names, group_name, user } = payload;

            // Notification Logic
            let title = "";
            let message = "";
            const link = "/guests";

            if (names.length === 1) {
                title = "Novo Convidado ➕";
                message = `${user} adicionou um novo convidado: ${names[0]} (${group_name}).`;
            } else if (names.length > 1) {
                title = "Novos Convidados ➕";
                message = `${user} adicionou ${names.length} novos convidados em ${group_name}.`;
            }

            if (title && message) {
                try {
                    await supabase.from("notifications").insert({
                        type: "rsvp",
                        title,
                        message,
                        link
                    });

                    await sendPushToUser(request, "all", title, message, link);
                } catch (notifError) {
                    console.error("Error sending notification for guest (non-fatal):", notifError);
                }
            }

            return Response.json({ success: true });
        }

        if (payload.intent === "update_rsvp") {
            const { id, status } = payload;

            // Fetch guest name for notification
            const { data: guest } = await supabase
                .from("guests")
                .select("name")
                .eq("id", id)
                .single();

            if (guest) {
                const title = "Atualização de RSVP 📩";
                const message = `${guest.name} teve a presença marcada como "${status}".`;
                const link = "/guests";

                try {
                    await supabase.from("notifications").insert({
                        type: "rsvp",
                        title,
                        message,
                        link
                    });

                    await sendPushToUser(request, "all", title, message, link);
                } catch (notifError) {
                    console.error("Error sending notification for RSVP (non-fatal):", notifError);
                }
            }

            return Response.json({ success: true });
        }

        return Response.json({ error: "Invalid intent" }, { status: 400 });

    } catch (error: any) {
        console.error("Error in api.guests:", error);

        if (error instanceof z.ZodError) {
            return Response.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
        }

        return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
};
