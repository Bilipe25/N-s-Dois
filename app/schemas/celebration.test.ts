import { describe, expect, it } from "vitest";
import { IdentifyGuestSchema, PixPayloadRequestSchema, PublicGiftSchema, PublicRsvpRegistrationSchema, RsvpRequestSchema } from "./celebration";

const eventId = "550e8400-e29b-41d4-a716-446655440000";

describe("schema de RSVP", () => {
  it("aceita uma resposta dentro dos limites globais", () => {
    expect(RsvpRequestSchema.safeParse({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 2, confirmedChildren: 1, message: "Até lá" }] }).success).toBe(true);
  });

  it("rejeita acompanhantes e mensagens acima dos limites", () => {
    expect(RsvpRequestSchema.safeParse({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 21, confirmedChildren: 0, message: "x".repeat(1001) }] }).success).toBe(false);
  });
});

describe("contratos públicos de presentes", () => {
  it("aceita PIX livre, por presente ou por reserva, mas não duas referências", () => {
    const reservationId = "550e8400-e29b-41d4-a716-446655440001";
    expect(PixPayloadRequestSchema.safeParse({}).success).toBe(true);
    expect(PixPayloadRequestSchema.safeParse({ giftId: eventId }).success).toBe(true);
    expect(PixPayloadRequestSchema.safeParse({ reservationId }).success).toBe(true);
    expect(PixPayloadRequestSchema.safeParse({ giftId: eventId, reservationId }).success).toBe(false);
  });

  it("mantém o contrato público sem identidade da reserva", () => {
    const parsed = PublicGiftSchema.parse({
      id: eventId,
      item_name: "Torradeira",
      category: "Cozinha",
      suggested_store: null,
      link: null,
      price_range: "R$ 50 a R$ 150",
      price_cents: null,
      image_url: null,
      available: true,
      reservation_id: null,
    });
    expect(parsed).not.toHaveProperty("reserved_by");
    expect(parsed).not.toHaveProperty("guest_id");
  });

  it("aceita a resposta geral quando ainda não há evento publicado", () => {
    expect(RsvpRequestSchema.safeParse({ generalResponse: { status: "confirmado", confirmedAdults: 2, confirmedChildren: 0, message: "Vamos!" } }).success).toBe(true);
  });

  it("limita cadastros espontâneos a seis adultos e seis crianças", () => {
    expect(PublicRsvpRegistrationSchema.safeParse({ name: "Maria da Silva", status: "confirmado", confirmedAdults: 1, confirmedChildren: 6 }).success).toBe(true);
    expect(PublicRsvpRegistrationSchema.safeParse({ name: "Maria da Silva", status: "confirmado", confirmedAdults: 7, confirmedChildren: 0 }).success).toBe(false);
    expect(PublicRsvpRegistrationSchema.safeParse({ name: "Maria da Silva", status: "confirmado", confirmedAdults: 0, confirmedChildren: 1 }).success).toBe(false);
  });

  it("exige nome completo plausível sem impor grafia ao valor exibido", () => {
    expect(IdentifyGuestSchema.safeParse({ name: "  João Ávila  " }).success).toBe(true);
    expect(IdentifyGuestSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});
