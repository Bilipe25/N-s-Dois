import { describe, expect, it } from "vitest";
import { derivePublicRsvpState, rsvpBlockCopy, rsvpCtaLabel } from "./public-rsvp-state";

describe("estado público do RSVP", () => {
  it.each([
    [{ active: false, responses: [], general: null }, "unidentified", "Confirmar presença"],
    [{ active: true, responses: [], general: { status: "pendente" as const } }, "pending", "Confirmar presença"],
    [{ active: true, responses: [{ status: "confirmado" as const }], general: null }, "confirmed", "Ver minha confirmação"],
    [{ active: true, responses: [{ status: "recusado" as const }], general: null }, "declined", "Ver minha resposta"],
    [{ active: true, responses: [{ status: "confirmado" as const }, { status: "recusado" as const }], general: null }, "mixed", "Ver minhas respostas"],
    [{ active: true, responses: [{ status: "confirmado" as const }, { status: "pendente" as const }], general: null }, "partial", "Concluir confirmação"],
  ])("deriva %s", (input, expectedState, expectedLabel) => {
    const state = derivePublicRsvpState(input);
    expect(state).toBe(expectedState);
    expect(rsvpCtaLabel(state)).toBe(expectedLabel);
  });

  it("personaliza o resumo confirmado", () => {
    expect(rsvpBlockCopy("confirmed", "Raabe")).toMatchObject({ title: "Tudo certo, Raabe!", action: "Ver ou alterar resposta" });
  });
});
