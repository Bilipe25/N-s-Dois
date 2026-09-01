import { describe, expect, it } from "vitest";
import { pixReferenceForGift } from "./gift-reservations";

const giftId = "22222222-2222-4222-8222-222222222222";
const reservationId = "33333333-3333-4333-8333-333333333333";

describe("referência de PIX para presente", () => {
  it("mantém o PIX geral sem referência", () => {
    expect(pixReferenceForGift(null)).toEqual({});
  });

  it("usa o presente enquanto não há reserva própria", () => {
    expect(pixReferenceForGift({ id: giftId, reservation_id: null })).toEqual({ giftId });
  });

  it("prefere a reserva ativa do próprio convidado", () => {
    expect(pixReferenceForGift({ id: giftId, reservation_id: reservationId })).toEqual({ reservationId });
  });
});
