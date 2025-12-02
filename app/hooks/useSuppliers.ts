import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import { SupplierSchema, type SupplierInput } from "@/schemas/supplier";
import { toast } from "sonner";

// Helper to get supabase client (client-side)
const getSupabase = () => createClient(null as any); // null request for client-side

export const useSuppliers = () => {
    return useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from("suppliers")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });
};

export const useSupplier = (id: string) => {
    return useQuery({
        queryKey: ["suppliers", id],
        queryFn: async () => {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from("suppliers")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateSupplier = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newSupplier: SupplierInput) => {
            // Validate with Zod before sending
            const validatedData = SupplierSchema.parse(newSupplier);

            const supabase = getSupabase();
            const { data, error } = await supabase
                .from("suppliers")
                .insert(validatedData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Fornecedor criado com sucesso!");
        },
        onError: (error: any) => {
            console.error("Erro ao criar fornecedor:", error);
            toast.error(`Erro ao criar: ${error.message || "Erro desconhecido"}`);
        }
    });
};

export const useUpdateSupplier = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<SupplierInput> }) => {
            // Validate partial updates if needed, or trust the partial type
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from("suppliers")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            queryClient.invalidateQueries({ queryKey: ["suppliers", id] });
            toast.success("Fornecedor atualizado!");
        },
        onError: (error: any) => {
            console.error("Erro ao atualizar:", error);
            toast.error("Erro ao atualizar fornecedor.");
        }
    });
};

export const useDeleteSupplier = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = getSupabase();
            const { error } = await supabase
                .from("suppliers")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Fornecedor removido.");
        },
        onError: (error: any) => {
            console.error("Erro ao remover:", error);
            toast.error("Erro ao remover fornecedor.");
        }
    });
};
