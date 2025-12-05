import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    Gift,
    Guest,
    Config,
    ReserveGiftInput,
    CreateGiftInput,
    UpdateGiftInput,
    CreateGuestInput,
    UpdateConfigInput,
    BulkUpdateCategoryInput,
    ConfirmPresenceInput
} from "@/schemas/bridal-shower";
import { toast } from "sonner";
import type { Guest as MainGuest } from "@/schemas/guest";

// --- QUERIES ---

export const useBridalData = () => {
    return useQuery({
        queryKey: ["bridal_data"],
        queryFn: async () => {
            const response = await fetch("/api/bridal-shower");
            if (!response.ok) throw new Error("Erro ao carregar dados");
            return await response.json() as { gifts: Gift[], guests: Guest[], config: Config };
        }
    });
};

export const useGifts = () => {
    const result = useBridalData();
    return { ...result, data: result.data?.gifts || [] };
};

export const useGuests = () => {
    const { data } = useBridalData();
    return { data: data?.guests || [] };
};

export const useBridalConfig = () => {
    const { data } = useBridalData();
    return { data: data?.config };
};

// Hook to fetch main guests for import
export const useMainGuests = () => {
    return useQuery({
        queryKey: ["main_guests"],
        queryFn: async () => {
            const response = await fetch("/api/guests");
            if (!response.ok) throw new Error("Erro ao carregar convidados");
            const data = await response.json();
            return data.guests as MainGuest[];
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
        },
        onError: (error: any) => toast.error(error.message)
    });
};

// --- MUTATIONS (ADMIN) ---

export const useCreateGift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateGiftInput) => {
            const response = await fetch("/api/bridal-shower?intent=create_gift", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input)
            });
            if (!response.ok) throw new Error("Erro ao criar presente");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Presente adicionado!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useUpdateGift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateGiftInput) => {
            const response = await fetch("/api/bridal-shower?intent=update_gift", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input)
            });
            if (!response.ok) throw new Error("Erro ao atualizar presente");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Presente atualizado!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useDeleteGift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/bridal-shower?intent=delete_gift&id=${id}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Erro ao remover presente");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Presente removido!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useToggleGiftStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, currentStatus }: { id: string, currentStatus: string }) => {
            const response = await fetch("/api/bridal-shower?intent=toggle_gift_status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, currentStatus })
            });
            if (!response.ok) throw new Error("Erro ao alterar status");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useBulkUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: BulkUpdateCategoryInput) => {
            const response = await fetch("/api/bridal-shower?intent=bulk_update_category", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input)
            });
            if (!response.ok) throw new Error("Erro ao atualizar categorias");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Categorias atualizadas!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useCreateGuest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateGuestInput) => {
            const response = await fetch("/api/bridal-shower?intent=create_guest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input)
            });
            if (!response.ok) throw new Error("Erro ao criar convidado");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Convidado adicionado!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useDeleteGuest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/bridal-shower?intent=delete_guest&id=${id}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Erro ao remover convidado");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Convidado removido!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useToggleGuestConfirm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, current }: { id: string, current: boolean }) => {
            const response = await fetch("/api/bridal-shower?intent=toggle_guest_confirm", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, current })
            });
            if (!response.ok) throw new Error("Erro ao alterar confirmação");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useUpdateConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: UpdateConfigInput }) => {
            const response = await fetch(`/api/bridal-shower?intent=update_config&id=${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error("Erro ao atualizar configurações");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Configurações salvas!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useConfirmPresence = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: ConfirmPresenceInput) => {
            const response = await fetch("/api/confirm-presence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input)
            });
            if (!response.ok) throw new Error("Erro ao confirmar presença");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Presença confirmada!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useImportGifts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (importText: string) => {
            const lines = importText.split('\n');
            const gifts = [];

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
                const suggested_store = parts[1]?.trim() || undefined;
                const price_range = parts[2]?.trim() || undefined;

                if (item_name) {
                    gifts.push({
                        item_name,
                        suggested_store,
                        price_range,
                        status: 'disponivel',
                        category: 'Outros'
                    });
                }
            }

            if (gifts.length > 0) {
                const response = await fetch("/api/bridal-shower?intent=import_gifts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gifts })
                });
                if (!response.ok) throw new Error("Erro ao importar presentes");
                return await response.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
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
            const guests = [];

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
                const phone = parts[1]?.trim() || undefined;

                if (name) {
                    guests.push({
                        name,
                        phone,
                        confirmed: false
                    });
                }
            }

            if (guests.length > 0) {
                const response = await fetch("/api/bridal-shower?intent=import_guests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ guests })
                });
                if (!response.ok) throw new Error("Erro ao importar convidados");
                return await response.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Convidados importados!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

// Import selected guests from main guests list
export const useImportGuestsFromMain = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (selectedGuests: MainGuest[]) => {
            const guests = selectedGuests.map(g => ({
                name: g.name,
                phone: undefined,
                confirmed: g.rsvp_status === 'confirmado'
            }));

            if (guests.length > 0) {
                const response = await fetch("/api/bridal-shower?intent=import_guests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ guests })
                });
                if (!response.ok) throw new Error("Erro ao importar convidados");
                return await response.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bridal_data"] });
            toast.success("Convidados importados com sucesso!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

