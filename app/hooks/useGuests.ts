import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { Guest, AddGuestInput, UpdateGuestInput, UpdateRSVPInput, BulkActionInput } from "@/schemas/guest";
import { toast } from "sonner";

// Initialize client safely (using the fix in lib/supabase.ts)
const supabase = createClient();

// --- QUERIES ---

export const useGuests = () => {
    return useQuery({
        queryKey: ["guests"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("guests")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            return data as Guest[];
        }
    });
};

export const useGuest = (id: string) => {
    return useQuery({
        queryKey: ["guests", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("guests")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as Guest;
        },
        enabled: !!id
    });
};

export const useAppConfig = () => {
    return useQuery({
        queryKey: ["app_config"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("app_config")
                .select("*")
                .single();

            if (error) throw error;
            return data;
        }
    });
};

// --- MUTATIONS ---

export const useAddGuest = (user: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: AddGuestInput) => {
            const names = input.name.split('\n').filter(n => n.trim().length > 0);
            const guestsToAdd = names.map(n => ({
                name: n.trim(),
                group_name: input.group_name,
                adults_count: input.adults_count,
                children_count: input.children_count,
                rsvp_status: "pendente"
            }));

            const { data, error } = await supabase.from("guests").insert(guestsToAdd).select();
            if (error) throw error;

            // Notifications
            if (names.length === 1) {
                await supabase.from("notifications").insert({
                    type: "rsvp",
                    title: "Novo Convidado ➕",
                    message: `${user} adicionou um novo convidado: ${names[0]} (${input.group_name}).`,
                    link: "/guests"
                });
            } else if (names.length > 1) {
                await supabase.from("notifications").insert({
                    type: "rsvp",
                    title: "Novos Convidados ➕",
                    message: `${user} adicionou ${names.length} novos convidados em ${input.group_name}.`,
                    link: "/guests"
                });
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guests"] });
            toast.success("Convidado(s) adicionado(s)!");
        },
        onError: (error: any) => toast.error(`Erro ao adicionar: ${error.message}`)
    });
};

export const useUpdateGuest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateGuestInput) => {
            const { error } = await supabase
                .from("guests")
                .update({
                    name: input.name,
                    group_name: input.group_name,
                    adults_count: input.adults_count,
                    children_count: input.children_count,
                    rsvp_status: input.rsvp_status
                })
                .eq("id", input.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guests"] });
            toast.success("Convidado atualizado!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useUpdateRSVP = (user: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: UpdateRSVPInput) => {
            // Fetch guest name for notification
            const { data: guest } = await supabase
                .from("guests")
                .select("name")
                .eq("id", id)
                .single();

            const { error } = await supabase.from("guests").update({ rsvp_status: status }).eq("id", id);
            if (error) throw error;

            if (guest) {
                await supabase.from("notifications").insert({
                    type: "rsvp",
                    title: "Atualização de RSVP 📩",
                    message: `${guest.name} teve a presença marcada como "${status}".`,
                    link: "/guests"
                });
            }
        },
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["guests"] });
            const previousGuests = queryClient.getQueryData<Guest[]>(["guests"]);

            if (previousGuests) {
                queryClient.setQueryData<Guest[]>(["guests"], (old) =>
                    old?.map(g => g.id === id ? { ...g, rsvp_status: status } : g)
                );
            }
            return { previousGuests };
        },
        onError: (err, newTodo, context) => {
            if (context?.previousGuests) {
                queryClient.setQueryData(["guests"], context.previousGuests);
            }
            toast.error("Erro ao atualizar RSVP.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guests"] });
            toast.success("RSVP atualizado!");
        }
    });
};

export const useDeleteGuest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("guests").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guests"] });
            toast.success("Convidado removido!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useBulkConfirm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ids }: BulkActionInput) => {
            const { error } = await supabase
                .from("guests")
                .update({ rsvp_status: "confirmado" })
                .in("id", ids);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guests"] });
            toast.success("Convidados confirmados!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useBulkDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ids }: BulkActionInput) => {
            const { error } = await supabase.from("guests").delete().in("id", ids);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guests"] });
            toast.success("Convidados excluídos!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};
