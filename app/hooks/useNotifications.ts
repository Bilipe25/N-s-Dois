import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Notification } from "@/schemas/notifications";
import { toast } from "sonner";

async function fetchNotifications() {
    const response = await fetch("/api/notifications");
    if (!response.ok) {
        throw new Error("Failed to fetch notifications");
    }
    const data = await response.json();
    return data.notifications as Notification[];
}

async function markNotificationRead(id: string) {
    const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark as read");
    }
    return true;
}

async function markAllNotificationsRead() {
    const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark all as read");
    }
    return true;
}

async function deleteNotification(id: string) {
    const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete notification");
    }
    return true;
}

export function useNotifications(initialData?: Notification[]) {
    return useQuery({
        queryKey: ["notifications"],
        queryFn: fetchNotifications,
        initialData,
    });
}

export function useUnreadNotificationsCount(initialData?: Notification[]) {
    const { data: notifications } = useNotifications(initialData);
    return notifications?.filter((n) => !n.read).length || 0;
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markNotificationRead,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] });
            const previousNotifications = queryClient.getQueryData<Notification[]>(["notifications"]);

            if (previousNotifications) {
                queryClient.setQueryData<Notification[]>(["notifications"], (old) => {
                    return old?.map((n) => (n.id === id ? { ...n, read: true } : n));
                });
            }

            return { previousNotifications };
        },
        onError: (err, id, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(["notifications"], context.previousNotifications);
            }
            toast.error("Erro ao marcar como lida");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markAllNotificationsRead,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] });
            const previousNotifications = queryClient.getQueryData<Notification[]>(["notifications"]);

            if (previousNotifications) {
                queryClient.setQueryData<Notification[]>(["notifications"], (old) => {
                    return old?.map((n) => ({ ...n, read: true }));
                });
            }

            return { previousNotifications };
        },
        onError: (err, variables, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(["notifications"], context.previousNotifications);
            }
            toast.error("Erro ao marcar todas como lidas");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteNotification,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] });
            const previousNotifications = queryClient.getQueryData<Notification[]>(["notifications"]);

            if (previousNotifications) {
                queryClient.setQueryData<Notification[]>(["notifications"], (old) => {
                    return old?.filter((n) => n.id !== id);
                });
            }

            return { previousNotifications };
        },
        onError: (err, id, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(["notifications"], context.previousNotifications);
            }
            toast.error("Erro ao excluir notificação");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}
