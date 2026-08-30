import { describe, expect, it } from "vitest";
import { RsvpRequestSchema } from "./celebration";

const eventId = "550e8400-e29b-41d4-a716-446655440000";

describe("schema de RSVP", () => {
  it("aceita uma resposta dentro dos limites globais", () => {
    expect(RsvpRequestSchema.safeParse({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 2, confirmedChildren: 1, message: "Até lá" }] }).success).toBe(true);
  });

  it("rejeita acompanhantes e mensagens acima dos limites", () => {
    expect(RsvpRequestSchema.safeParse({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 21, confirmedChildren: 0, message: "x".repeat(1001) }] }).success).toBe(false);
  });
});
