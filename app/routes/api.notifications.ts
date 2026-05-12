import { type ActionFunctionArgs, type LoaderFunctionArgs, data } from "react-router";
import { createClient } from "@/lib/supabase";
import { requireUserSession } from "@/sessions";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createClient(request);

    const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw data({ error: error.message }, { status: 500 });
    }

    return { notifications };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createClient(request);
    const method = request.method;

    if (method === "PATCH") {
        try {
            const jsonData = await request.json();
            const { id, markAll } = jsonData;

            if (markAll) {
                const { error } = await supabase
                    .from("notifications")
                    .update({ read: true })
                    .eq("read", false);

                if (error) throw error;
                return { success: true };
            }

            if (id) {
                const { error } = await supabase
                    .from("notifications")
                    .update({ read: true })
                    .eq("id", id);

                if (error) throw error;
                return { success: true };
            }

            return data({ error: "Invalid request" }, { status: 400 });
        } catch (error) {
            return data({ error: (error as any).message }, { status: 500 });
        }
    }

    if (method === "DELETE") {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return data({ error: "ID is required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id);

        if (error) {
            return data({ error: error.message }, { status: 500 });
        }

        return { success: true };
    }

    return data({ error: "Method not allowed" }, { status: 405 });
};
