import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Asset, CreateAssetInput, UpdateAssetInput } from "@/schemas/assets";
import { toast } from "sonner";

interface ReservedGift {
    id: string;
    item_name: string;
    category: string | null;
    reserved_by: string | null;
    reserved_at: string | null;
    image_url: string | null;
    price_range: string | null;
}

interface AssetsData {
    assets: Asset[];
    reservedGifts: ReservedGift[];
}

// Fetch assets
async function fetchAssets(): Promise<AssetsData> {
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

// Update asset
async function updateAsset(input: UpdateAssetInput): Promise<Asset> {
    const response = await fetch("/api/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar bem");
    }
    return data.asset;
}

// Delete asset
async function deleteAsset(id: string): Promise<void> {
    const response = await fetch(`/api/assets?id=${id}`, {
        method: "DELETE"
    });
    const data = await response.json();
    if (!response.ok) {
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

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            toast.success("Bem atualizado com sucesso!");
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

// Hook para adicionar presente reservado como bem
export function useAddGiftAsAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (gift: ReservedGift) => {
            const formData = new FormData();
            formData.append("name", gift.item_name);
            formData.append("category", gift.category || "Outros");
            formData.append("value", "0");
            formData.append("notes", `Presente do Chá de Casa Nova • Reservado por: ${gift.reserved_by || "Anônimo"}`);
            formData.append("source", "bridal_shower");
            formData.append("bridal_gift_id", gift.id);
            if (gift.image_url) {
                formData.append("photo_url", gift.image_url);
            }

            return createAsset(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            toast.success("Presente adicionado aos seus bens!");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
}
