import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChecklistItem, type CreateChecklistItemInput, type UpdateChecklistItemInput } from "@/schemas/checklist";
import { toast } from "sonner";

async function fetchChecklist() {
    const response = await fetch("/api/checklist");
    if (!response.ok) {
        throw new Error("Failed to fetch checklist");
    }
    const data = await response.json();
    return data.items as ChecklistItem[];
}

async function createChecklistItem(data: CreateChecklistItemInput) {
    const response = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create item");
    }
    const result = await response.json();
    return result.item as ChecklistItem;
}

async function updateChecklistItem({ id, ...data }: UpdateChecklistItemInput & { id: string }) {
    const response = await fetch("/api/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update item");
    }
    const result = await response.json();
    return result.item as ChecklistItem;
}

async function deleteChecklistItem(id: string) {
    const response = await fetch(`/api/checklist?id=${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
    }
    return true;
}

export function useChecklist(initialData?: ChecklistItem[]) {
    return useQuery({
        queryKey: ["checklist"],
        queryFn: fetchChecklist,
        initialData,
    });
}

export function useCreateChecklistItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createChecklistItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["checklist"] });
            toast.success("Tarefa criada com sucesso!");
        },
        onError: (error) => {
            toast.error(`Erro ao criar tarefa: ${error.message}`);
        },
    });
}

export function useUpdateChecklistItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateChecklistItem,
        onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: ["checklist"] });
            const previousChecklist = queryClient.getQueryData<ChecklistItem[]>(["checklist"]);

            if (previousChecklist) {
                queryClient.setQueryData<ChecklistItem[]>(["checklist"], (old) => {
                    return old?.map((item) => {
                        if (item.id === newItem.id) {
                            // Ensure subtasks match the expected type (done is required)
                            const updatedSubtasks = newItem.subtasks?.map(st => ({
                                ...st,
                                done: st.done ?? false
                            }));

                            return {
                                ...item,
                                ...newItem,
                                subtasks: updatedSubtasks || item.subtasks
                            };
                        }
                        return item;
                    });
                });
            }

            return { previousChecklist };
        },
        onError: (err, newItem, context) => {
            if (context?.previousChecklist) {
                queryClient.setQueryData(["checklist"], context.previousChecklist);
            }
            toast.error(`Erro ao atualizar tarefa: ${err.message}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["checklist"] });
        },
    });
}

export function useDeleteChecklistItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteChecklistItem,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["checklist"] });
            const previousChecklist = queryClient.getQueryData<ChecklistItem[]>(["checklist"]);

            if (previousChecklist) {
                queryClient.setQueryData<ChecklistItem[]>(["checklist"], (old) => {
                    return old?.filter((item) => item.id !== id);
                });
            }

            return { previousChecklist };
        },
        onError: (err, id, context) => {
            if (context?.previousChecklist) {
                queryClient.setQueryData(["checklist"], context.previousChecklist);
            }
            toast.error(`Erro ao excluir tarefa: ${err.message}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["checklist"] });
            toast.success("Tarefa excluída com sucesso!");
        },
    });
}
