import { describe, expect, it } from "vitest";
import { confirmedCounts, guestHasPrivateMessage, respondedToday } from "./guest-rsvp";

describe("leitura administrativa de RSVP", () => {
  it("calcula hoje no fuso da celebração, inclusive perto da meia-noite UTC", () => {
    const now = new Date("2026-09-01T02:30:00.000Z");
    expect(respondedToday("2026-09-01T01:00:00.000Z", now)).toBe(true);
    expect(respondedToday("2026-09-01T04:00:00.000Z", now)).toBe(false);
  });

  it("usa as quantidades respondidas e zera uma recusa", () => {
    expect(confirmedCounts({ rsvp_status: "confirmado", adults_count: 4, children_count: 2, rsvp_adults: 2, rsvp_children: 1 })).toEqual({ adults: 2, children: 1 });
    expect(confirmedCounts({ rsvp_status: "recusado", adults_count: 4, children_count: 2, rsvp_adults: 2, rsvp_children: 1 })).toEqual({ adults: 0, children: 0 });
  });

  it("encontra mensagem geral ou de um evento", () => {
    expect(guestHasPrivateMessage({ rsvp_message: null, event_responses: [{ private_message: "Até lá" }] as never })).toBe(true);
    expect(guestHasPrivateMessage({ rsvp_message: "", event_responses: [] })).toBe(false);
  });
});
