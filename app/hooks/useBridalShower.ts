import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { Gift, Guest, Config, ReserveGiftInput, AddGiftInput, AddGuestInput, UpdateConfigSchema } from "@/schemas/bridal-shower";
import { toast } from "sonner";
import { z } from "zod";

const supabase = createClient(null as any);

// --- QUERIES ---

export const useGifts = () => {
    return useQuery({
        queryKey: ["bridal_gifts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("bridal_shower_gifts")
                .select("*")
                .order("item_name");
            if (error) throw error;
            return data as Gift[];
        }
    });
};

export const useGuests = () => {
    return useQuery({
        queryKey: ["bridal_guests"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("bridal_shower_guests")
                .select("*")
                .order("name");
            if (error) throw error;
            return data as Guest[];
        }
    });
};

export const useBridalConfig = () => {
    return useQuery({
        queryKey: ["bridal_config"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("app_config")
                .select("*")
                .single();
            if (error) throw error;
            return data as Config;
        }
    });
};

// --- MUTATIONS (PUBLIC) ---

export const useReserveGift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: ReserveGiftInput) => {
            const response = await fetch("/api/reserve-gift", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Erro ao reservar presente");
            return data;
        },
        onMutate: async (newReservation) => {
            await queryClient.cancelQueries({ queryKey: ["bridal_gifts"] });
            const previousGifts = queryClient.getQueryData<Gift[]>(["bridal_gifts"]);

            // Optimistic Update
            if (previousGifts) {
                queryClient.setQueryData<Gift[]>(["bridal_gifts"], (old) =>
                    old?.map(gift =>
                        gift.id === newReservation.id
                            ? { ...gift, status: "comprado", reserved_by: newReservation.name }
                            : gift
                    )
                );
            }
            return { previousGifts };
        },
        onError: (err, newReservation, context) => {
            if (context?.previousGifts) {
                queryClient.setQueryData(["bridal_gifts"], context.previousGifts);
            }
            toast.error(err.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_gifts"] });
        }
    });
};

// --- MUTATIONS (ADMIN) ---

export const useAddGift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: AddGiftInput) => {
            const { error } = await supabase.from("bridal_shower_gifts").insert({
                ...input,
                status: "disponivel"
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_gifts"] });
            toast.success("Presente adicionado!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useUpdateGift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Gift> & { id: string }) => {
            const { error } = await supabase.from("bridal_shower_gifts").update(updates).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_gifts"] });
            toast.success("Presente atualizado!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useDeleteGift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("bridal_shower_gifts").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_gifts"] });
            toast.success("Presente removido!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useToggleGiftStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, currentStatus }: { id: string, currentStatus: string }) => {
            const newStatus = currentStatus === 'comprado' ? 'disponivel' : 'comprado';
            const { error } = await supabase.from("bridal_shower_gifts").update({ status: newStatus }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_gifts"] });
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useBulkUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ids, category }: { ids: string[], category: string }) => {
            const { error } = await supabase.from("bridal_shower_gifts").update({ category }).in("id", ids);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_gifts"] });
            toast.success("Categorias atualizadas!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useAddGuest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: AddGuestInput) => {
            const { error } = await supabase.from("bridal_shower_guests").insert(input);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_guests"] });
            toast.success("Convidado adicionado!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useDeleteGuest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("bridal_shower_guests").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_guests"] });
            toast.success("Convidado removido!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useToggleGuestConfirm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, current }: { id: string, current: boolean }) => {
            const { error } = await supabase.from("bridal_shower_guests").update({ confirmed: !current }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_guests"] });
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useUpdateConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: z.infer<typeof UpdateConfigSchema> }) => {
            const { error } = await supabase.from("app_config").update({
                bridal_shower_date: updates.date || null,
                bridal_shower_location: updates.location
            }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_config"] });
            toast.success("Configurações salvas!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useImportGifts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (importText: string) => {
            const lines = importText.split('\n');
            const giftsToInsert = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                let parts = [];
                if (trimmedLine.includes('|')) {
                    parts = trimmedLine.split('|');
                } else if (trimmedLine.includes(';')) {
                    parts = trimmedLine.split(';');
                } else {
                    parts = [trimmedLine];
                }

                const item_name = parts[0]?.trim();
                const suggested_store = parts[1]?.trim() || null;
                const price_range = parts[2]?.trim() || null;

                if (item_name) {
                    giftsToInsert.push({
                        item_name,
                        suggested_store,
                        price_range,
                        status: 'disponivel'
                    });
                }
            }

            if (giftsToInsert.length > 0) {
                const { error } = await supabase.from("bridal_shower_gifts").insert(giftsToInsert);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_gifts"] });
            toast.success("Presentes importados!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useImportGuests = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (importText: string) => {
            const lines = importText.split('\n');
            const guestsToInsert = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                let parts = [];
                if (trimmedLine.includes('|')) {
                    parts = trimmedLine.split('|');
                } else if (trimmedLine.includes(';')) {
                    parts = trimmedLine.split(';');
                } else {
                    parts = [trimmedLine];
                }

                const name = parts[0]?.trim();
                const phone = parts[1]?.trim() || null;

                if (name) {
                    guestsToInsert.push({
                        name,
                        phone,
                        confirmed: false
                    });
                }
            }

            if (guestsToInsert.length > 0) {
                const { error } = await supabase.from("bridal_shower_guests").insert(guestsToInsert);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_guests"] });
            toast.success("Convidados importados!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};
