import type { PublicGift } from "@/schemas/celebration";
import { requestJson } from "@/lib/http.client";

export function pixReferenceForGift(gift: Pick<PublicGift, "id" | "reservation_id"> | null) {
  if (!gift) return {};
  if (gift.reservation_id) return { reservationId: gift.reservation_id };
  return { giftId: gift.id };
}

export function createGiftReservation(giftId: string) {
  return requestJson<{ success: true; reservationId: string }>(
    "/api/public/celebracao/gift-reservations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId }),
    },
  );
}

export function cancelGiftReservation(reservationId: string) {
  return requestJson<{ success: true }>(
    `/api/public/celebracao/gift-reservations/${reservationId}`,
    { method: "DELETE" },
  );
}
