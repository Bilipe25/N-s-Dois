import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type BudgetItem, type CreateBudgetItemInput, type UpdateBudgetItemInput } from "@/schemas/budget";
import { toast } from "sonner";

async function fetchBudget() {
    const response = await fetch("/api/budget");
    if (!response.ok) {
        throw new Error("Failed to fetch budget");
    }
    const data = await response.json();
    return data.items as BudgetItem[];
}

async function createBudgetItem(data: CreateBudgetItemInput) {
    const response = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create item");
    }
    const result = await response.json();
    return result.item as BudgetItem;
}

async function updateBudgetItem(data: UpdateBudgetItemInput) {
    const response = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update item");
    }
    const result = await response.json();
    return result.item as BudgetItem;
}

async function deleteBudgetItem(id: string) {
    const response = await fetch(`/api/budget?id=${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
    }
    return true;
}

export function useBudget(initialData?: BudgetItem[]) {
    return useQuery({
        queryKey: ["budget"],
        queryFn: fetchBudget,
        initialData,
    });
}

export function useCreateBudgetItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBudgetItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budget"] });
            toast.success("Gasto adicionado com sucesso!");
        },
        onError: (error) => {
            toast.error(`Erro ao adicionar: ${error.message}`);
        },
    });
}

export function useUpdateBudgetItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBudgetItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budget"] });
            toast.success("Gasto atualizado com sucesso!");
        },
        onError: (error) => {
            toast.error(`Erro ao atualizar: ${error.message}`);
        },
    });
}

export function useDeleteBudgetItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBudgetItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budget"] });
            toast.success("Gasto excluído com sucesso!");
        },
        onError: (error) => {
            toast.error(`Erro ao excluir: ${error.message}`);
        },
    });
}
