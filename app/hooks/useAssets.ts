import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Tipos simples
export interface Asset {
    id: string;
    name: string;
    category: string;
    value: number | null;
    notes: string | null;
    photo_url: string | null;
    created_at: string;
}

export interface ReservedGift {
    id: string;
    item_name: string;
    category: string | null;
    reserved_by: string | null;
    reserved_at: string | null;
    image_url: string | null;
    price_range: string | null;
}

interface AssetsResponse {
    assets: Asset[];
    reservedGifts: ReservedGift[];
}

// Fetch assets
async function fetchAssets(): Promise<AssetsResponse> {
    const response = await fetch("/api/assets");
    if (!response.ok) {
        throw new Error("Erro ao carregar bens");
    }
    return await response.json();
}

// Create asset
async function createAsset(formData: FormData): Promise<Asset> {
    const response = await fetch("/api/assets", {
        method: "POST",
        body: formData
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Erro ao criar bem");
    }
    return data.asset;
}

// Delete asset
async function deleteAsset(id: string): Promise<void> {
    const response = await fetch(`/api/assets?id=${id}`, {
        method: "DELETE"
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao excluir bem");
    }
}

// --- HOOKS ---

export function useAssets() {
    return useQuery({
        queryKey: ["assets"],
        queryFn: fetchAssets
    });
}

export function useCreateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            toast.success("Bem adicionado com sucesso!");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            toast.success("Bem excluído com sucesso!");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
}
