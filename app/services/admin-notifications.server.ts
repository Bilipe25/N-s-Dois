import { createServerAdminClient } from "@/lib/supabase.server";
import { sendPushToUser } from "@/services/push.server";

export type AdminNotificationInput = {
  request: Request;
  type: "rsvp" | "public_rsvp" | "gift";
  title: string;
  message: string;
  link: string;
  imageUrl?: string | null;
  push?: boolean;
};

type PartyResponse = {
  name: string;
  status: "confirmado" | "recusado";
  adults: number;
  children: number;
  changed?: boolean;
  publicRegistration?: boolean;
};

function peopleSummary(adults: number, children: number) {
  const parts = [
    `${adults} ${adults === 1 ? "adulto" : "adultos"}`,
    `${children} ${children === 1 ? "criança" : "crianças"}`,
  ];
  return parts.join(" · ");
}

export function buildRsvpNotification(input: PartyResponse) {
  const sourcePrefix = input.publicRegistration ? "Nova pelo site · " : "";
  if (input.status === "recusado") {
    return {
      title: input.changed ? `${input.name} alterou a confirmação` : `${input.name} respondeu ao convite`,
      message: `${sourcePrefix}${input.changed ? "Agora não poderá estar presente." : "Não poderá estar presente."}`,
    };
  }

  return {
    title: input.changed ? `${input.name} alterou a confirmação` : `${input.name} confirmou presença`,
    message: `${sourcePrefix}${input.changed ? "Agora: " : ""}${peopleSummary(input.adults, input.children)}`,
  };
}

export function buildGiftNotification(input: {
  action: "reserved" | "cancelled";
  guestName: string;
  giftName: string;
}) {
  if (input.action === "cancelled") {
    return {
      title: `${input.guestName} liberou um presente`,
      message: `“${input.giftName}” voltou a ficar disponível.`,
    };
  }
  return {
    title: `${input.guestName} reservou um presente`,
    message: `“${input.giftName}”`,
  };
}

export async function notifyAdminsBestEffort(input: AdminNotificationInput) {
  try {
    const supabase = createServerAdminClient();
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        image_url: input.imageUrl || null,
      })
      .select("id")
      .single();

    if (error || !notification?.id) {
      console.error("Falha ao registrar notificação administrativa:", error?.message || "identificador ausente");
      return { notificationId: null, pushDelivered: false };
    }

    if (input.push === false) {
      return { notificationId: String(notification.id), pushDelivered: false };
    }

    try {
      const result = await sendPushToUser(
        input.request,
        "all",
        input.title,
        input.message,
        input.link,
        input.imageUrl || undefined,
        `notification-${notification.id}`,
      );
      return { notificationId: String(notification.id), pushDelivered: !result.error };
    } catch (error) {
      console.error("Falha ao entregar push administrativo:", error instanceof Error ? error.message : "erro desconhecido");
      return { notificationId: String(notification.id), pushDelivered: false };
    }
  } catch (error) {
    console.error("Falha inesperada ao criar notificação administrativa:", error instanceof Error ? error.message : "erro desconhecido");
    return { notificationId: null, pushDelivered: false };
  }
}
