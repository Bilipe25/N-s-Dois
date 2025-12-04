import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type AppConfig } from "@/schemas/settings";
import { toast } from "sonner";

async function fetchSettings() {
    const response = await fetch("/api/settings");
    if (!response.ok) {
        throw new Error("Failed to fetch settings");
    }
    const data = await response.json();
    return data.config as AppConfig;
}

async function updateSettings(formData: FormData) {
    const response = await fetch("/api/settings", {
        method: "POST",
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update settings");
    }
    return true;
}

export function useSettings(initialData?: AppConfig) {
    return useQuery({
        queryKey: ["settings"],
        queryFn: fetchSettings,
        initialData,
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success("Configurações salvas com sucesso!");
        },
        onError: (error) => {
            toast.error(`Erro ao salvar: ${error.message}`);
        },
    });
}
