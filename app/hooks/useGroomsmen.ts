import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { Groomsman, CreateGroomsmanInput, UpdateGroomsmanInput } from "@/schemas/groomsmen";
import { toast } from "sonner";

const getSupabase = () => createClient();

// --- QUERIES ---

export const useGroomsmen = (initialData?: Groomsman[]) => {
    return useQuery({
        queryKey: ["groomsmen"],
        queryFn: async () => {
            const response = await fetch("/api/groomsmen");
            if (!response.ok) throw new Error("Failed to fetch groomsmen");
            const data = await response.json();
            return data.groomsmen as Groomsman[];
        },
        initialData
    });
};

// --- MUTATIONS ---

export const useCreateGroomsman = (user: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateGroomsmanInput) => {
            let photoUrl = null;

            // Handle Photo Upload if present
            if (input.photo && input.photo instanceof File) {
                const supabase = getSupabase();
                const fileExt = input.photo.name.split('.').pop();
                const fileName = `groomsman_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("images")
                    .upload(fileName, input.photo, {
                        contentType: input.photo.type,
                        upsert: true
                    });

                if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

                const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                photoUrl = data.publicUrl;
            }

            // Call API
            const response = await fetch("/api/groomsmen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    intent: "create",
                    name: input.name,
                    role: input.role,
                    side: input.side,
                    photoUrl,
                    user
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao criar padrinho");
            }

            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["groomsmen"] });
            toast.success("Padrinho adicionado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateGroomsman = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateGroomsmanInput) => {
            let photoUrl = undefined;

            // Handle Photo Upload if present
            if (input.photo && input.photo instanceof File) {
                const supabase = getSupabase();
                const fileExt = input.photo.name.split('.').pop();
                const fileName = `groomsman_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("images")
                    .upload(fileName, input.photo, {
                        contentType: input.photo.type,
                        upsert: true
                    });

                if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

                const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                photoUrl = data.publicUrl;
            }

            // Call API
            const response = await fetch("/api/groomsmen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    intent: "update",
                    id: input.id,
                    name: input.name,
                    role: input.role,
                    side: input.side,
                    photoUrl
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao atualizar padrinho");
            }

            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["groomsmen"] });
            toast.success("Padrinho atualizado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });
};

export const useDeleteGroomsman = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch("/api/groomsmen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    intent: "delete",
                    id
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao remover padrinho");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["groomsmen"] });
            toast.success("Padrinho removido com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });
};
