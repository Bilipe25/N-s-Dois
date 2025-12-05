import { type ActionFunctionArgs, type LoaderFunctionArgs, data } from "react-router";
import { createClient } from "@/lib/supabase";
import { CreateBudgetItemSchema, UpdateBudgetItemSchema } from "@/schemas/budget";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const supabase = createClient(request);

    const { data: items, error } = await supabase
        .from("budget_items")
        .select("*, suppliers(name)")
        .order("created_at", { ascending: false });

    if (error) {
        throw data({ error: error.message }, { status: 500 });
    }

    return { items };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const supabase = createClient(request);
    const method = request.method;

    if (method === "POST") {
        try {
            const jsonData = await request.json();
            const parsedData = CreateBudgetItemSchema.parse(jsonData);

            // Calculate status
            let status = "pendente";
            if (parsedData.paid_value >= parsedData.estimated_value) {
                status = "pago";
            } else if (parsedData.paid_value > 0) {
                status = "parcial";
            }

            // Tratar data vazia como null
            const dueDate = parsedData.due_date && parsedData.due_date.trim() !== ""
                ? parsedData.due_date
                : null;

            if (dueDate && new Date(dueDate) < new Date() && status !== "pago") {
                status = "atrasado";
            }

            const { data: item, error } = await supabase
                .from("budget_items")
                .insert({ ...parsedData, due_date: dueDate, status })
                .select("*, suppliers(name)")
                .single();

            if (error) throw error;
            return { item };
        } catch (error) {
            return data({ error: (error as any).message || "Invalid data" }, { status: 400 });
        }
    }

    if (method === "PUT") {
        try {
            const jsonData = await request.json();
            const parsedData = UpdateBudgetItemSchema.parse(jsonData);
            const { id, ...updates } = parsedData;

            // Fetch current item to get values for status calculation
            const { data: currentItem } = await supabase
                .from("budget_items")
                .select("*")
                .eq("id", id)
                .single();

            if (!currentItem) throw new Error("Item not found");

            const estimated_value = updates.estimated_value ?? currentItem.estimated_value;
            const paid_value = updates.paid_value ?? currentItem.paid_value;

            // Tratar data vazia como null
            let due_date = updates.due_date !== undefined ? updates.due_date : currentItem.due_date;
            if (due_date && typeof due_date === 'string' && due_date.trim() === '') {
                due_date = null;
            }

            // Recalculate status
            let status = "pendente";
            if (paid_value >= estimated_value) {
                status = "pago";
            } else if (paid_value > 0) {
                status = "parcial";
            }

            if (due_date && new Date(due_date) < new Date() && status !== "pago") {
                status = "atrasado";
            }

            const { data: item, error } = await supabase
                .from("budget_items")
                .update({ ...updates, due_date, status })
                .eq("id", id)
                .select("*, suppliers(name)")
                .single();

            if (error) throw error;
            return { item };
        } catch (error) {
            return data({ error: (error as any).message || "Invalid data" }, { status: 400 });
        }
    }

    if (method === "DELETE") {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return data({ error: "ID is required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("budget_items")
            .delete()
            .eq("id", id);

        if (error) {
            return data({ error: error.message }, { status: 500 });
        }

        return { success: true };
    }

    return data({ error: "Method not allowed" }, { status: 405 });
};
