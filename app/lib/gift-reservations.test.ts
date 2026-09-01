import { describe, expect, it } from "vitest";
import {
  giftPixActionAfterIdentification,
  pixReferenceForGift,
  shouldGenerateGiftPix,
} from "./gift-reservations";

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

  it("mantém a decisão de reserva antes do PIX específico", () => {
    expect(shouldGenerateGiftPix({ gift: { reservation_id: null }, reservationAvailable: true, continueWithoutReservation: false })).toBe(false);
    expect(shouldGenerateGiftPix({ gift: { reservation_id: null }, reservationAvailable: true, continueWithoutReservation: true })).toBe(true);
  });

  it("libera o PIX geral, a reserva própria e reservas pausadas sem decisão intermediária", () => {
    expect(shouldGenerateGiftPix({ gift: null, reservationAvailable: true, continueWithoutReservation: false })).toBe(true);
    expect(shouldGenerateGiftPix({ gift: { reservation_id: reservationId }, reservationAvailable: true, continueWithoutReservation: false })).toBe(true);
    expect(shouldGenerateGiftPix({ gift: { reservation_id: null }, reservationAvailable: false, continueWithoutReservation: false })).toBe(true);
  });

  it("preserva a intenção depois de reconhecer a pessoa", () => {
    expect(giftPixActionAfterIdentification("reserve")).toBe("reserve");
    expect(giftPixActionAfterIdentification("pix")).toBe("generate-pix");
  });
});
