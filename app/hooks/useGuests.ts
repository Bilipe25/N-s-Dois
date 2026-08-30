import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Guest, AddGuestInput, UpdateGuestInput, UpdateRSVPInput, BulkActionInput } from "@/schemas/guest";
import type { GuestInviteMetadata } from "@/schemas/invite";
import { toast } from "sonner";

async function api<T>(body?: object): Promise<T> {
  const response = await fetch("/api/guests", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a ação.");
  return data as T;
}

export const useGuests = () => useQuery({ queryKey: ["guests"], queryFn: async () => (await api<{ guests: Guest[] }>()).guests });
export const useGuest = (id: string) => useQuery({ queryKey: ["guests", id], queryFn: async () => (await api<{ guests: Guest[] }>()).guests.find((guest) => guest.id === id)!, enabled: Boolean(id) });
export const useAppConfig = () => useQuery({ queryKey: ["app_config"], queryFn: async () => {
  const response = await fetch("/api/settings");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Configuração indisponível.");
  return data.config;
} });

function useApiMutation<TInput>(body: (input: TInput) => object, success: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: TInput) => api(body(input)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests"] }); toast.success(success); }, onError: (error: Error) => toast.error(error.message) });
}

export const useAddGuest = (_user: string) => useApiMutation<AddGuestInput>((input) => ({ intent: "add_guest", names: input.name.split("\n").map((name) => name.trim()).filter(Boolean), group_name: input.group_name, adults_count: input.adults_count, children_count: input.children_count }), "Convidado(s) adicionado(s)!");
export const useUpdateGuest = () => useApiMutation<UpdateGuestInput>((input) => ({ intent: "update_guest", id: input.id, name: input.name, group_name: input.group_name, adults_count: input.adults_count, children_count: input.children_count, status: input.rsvp_status }), "Convidado atualizado!");
export const useUpdateRSVP = (_user: string) => useApiMutation<UpdateRSVPInput>((input) => ({ intent: "update_rsvp", id: input.id, status: input.status }), "RSVP atualizado!");
export const useDeleteGuest = () => useApiMutation<string>((id) => ({ intent: "delete_guest", id }), "Convidado removido!");
export const useBulkConfirm = () => useApiMutation<BulkActionInput>((input) => ({ intent: "bulk_confirm", ids: input.ids }), "Convidados confirmados!");
export const useBulkDelete = () => useApiMutation<BulkActionInput>((input) => ({ intent: "bulk_delete", ids: input.ids }), "Convidados excluídos!");

export async function createGuestInviteLink(id: string, mode: "create" | "rotate") {
  return api<{ inviteUrl: string; invite: GuestInviteMetadata }>(mode === "rotate"
    ? { intent: "rotate_invite_link", id, confirmed: true }
    : { intent: "create_invite_link", id });
}
