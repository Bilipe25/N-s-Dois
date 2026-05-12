import { type ActionFunctionArgs, type LoaderFunctionArgs, data } from "react-router";
import { createClient } from "@/lib/supabase";
import { CreateChecklistItemSchema, UpdateChecklistItemSchema } from "@/schemas/checklist";
import { requireUserSession } from "@/sessions";
import { z } from "zod";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createClient(request);
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
        const { data: item, error } = await supabase
            .from("checklist_items")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            throw data({ error: error.message }, { status: 500 });
        }
        return { item };
    }

    const { data: items, error } = await supabase
        .from("checklist_items")
        .select("*")
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        throw data({ error: error.message }, { status: 500 });
    }

    return { items };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createClient(request);
    const method = request.method;

    if (method === "POST") {
        try {
            const jsonData = await request.json();
            const parsedData = CreateChecklistItemSchema.parse(jsonData);

            const { data: newItem, error } = await supabase
                .from("checklist_items")
                .insert({
                    title: parsedData.title,
                    category: parsedData.category,
                    due_date: parsedData.due_date,
                    assigned_to: parsedData.assigned_to,
                    notes: parsedData.notes,
                    status: "pendente",
                    subtasks: [],
                    attachments: []
                })
                .select()
                .single();

            if (error) throw error;

            return { item: newItem };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return data({ error: error.issues }, { status: 400 });
            }
            return data({ error: (error as any).message }, { status: 500 });
        }
    }

    if (method === "PUT") {
        try {
            const jsonData = await request.json();
            const { id, ...updateData } = jsonData;

            if (!id) {
                return data({ error: "ID is required" }, { status: 400 });
            }

            const parsedData = UpdateChecklistItemSchema.parse(updateData);

            // Fetch current task for notifications
            const { data: currentTask } = await supabase
                .from("checklist_items")
                .select("*")
                .eq("id", id)
                .single();

            const { data: updatedItem, error } = await supabase
                .from("checklist_items")
                .update(parsedData)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            // Notifications
            if (currentTask) {
                // Status changed to concluded
                if (parsedData.status === "concluido" && currentTask.status !== "concluido") {
                    await supabase.from("notifications").insert({
                        type: "task",
                        title: "Tarefa Concluída! ✅",
                        message: `A tarefa "${currentTask.title}" foi marcada como concluída.`,
                        link: "/checklist"
                    });
                }

                // Assigned to changed
                if (parsedData.assigned_to && parsedData.assigned_to !== "Ambos" && currentTask.assigned_to !== parsedData.assigned_to) {
                    await supabase.from("notifications").insert({
                        type: "task",
                        title: "Nova Tarefa Atribuída 📋",
                        message: `A tarefa "${currentTask.title}" foi atribuída a ${parsedData.assigned_to}.`,
                        link: `/checklist/${id}`
                    });
                }
            }

            return { item: updatedItem };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return data({ error: error.issues }, { status: 400 });
            }
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
            .from("checklist_items")
            .delete()
            .eq("id", id);

        if (error) {
            return data({ error: error.message }, { status: 500 });
        }

        return { success: true };
    }

    return data({ error: "Method not allowed" }, { status: 405 });
};
