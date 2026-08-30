import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  celebrationIsPast: vi.fn(),
  consumeRateLimit: vi.fn(),
  createServerAdminClient: vi.fn(),
  getCelebrationConfig: vi.fn(),
  getInviteGuestId: vi.fn(),
}));

vi.mock("@/lib/celebration-session.server", () => ({ getInviteGuestId: mocks.getInviteGuestId }));
vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/lib/security.server", () => ({
  assertSameOrigin: vi.fn(),
  consumeRateLimit: mocks.consumeRateLimit,
  noStoreHeaders: (headers?: HeadersInit) => new Headers(headers),
  readJsonBody: (request: Request) => request.json(),
}));
vi.mock("@/services/celebration.server", () => ({
  celebrationIsPast: mocks.celebrationIsPast,
  getCelebrationConfig: mocks.getCelebrationConfig,
}));

import { action } from "./api.public.celebration-rsvp";

const guestId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const rsvpId = "33333333-3333-4333-8333-333333333333";

function thenable<T>(result: T) {
  const chain: Record<string, unknown> = {};
  for (const method of ["eq", "in", "select", "single", "maybeSingle"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function request(body: unknown) {
  return new Request("https://example.com/api/public/celebracao/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://example.com" },
    body: JSON.stringify(body),
  });
}

describe("RSVP individual", () => {
  const updates: Array<Record<string, unknown>> = [];

  beforeEach(() => {
    updates.length = 0;
    mocks.consumeRateLimit.mockResolvedValue(true);
    mocks.getInviteGuestId.mockResolvedValue(guestId);
    mocks.getCelebrationConfig.mockResolvedValue({ rsvpEnabled: true });
    mocks.celebrationIsPast.mockResolvedValue(false);
    mocks.createServerAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "guest_event_rsvps") {
          return {
            select: () => thenable({ data: [{ id: rsvpId, event_id: eventId, adult_limit: 2, child_limit: 1 }], error: null }),
            update: (values: Record<string, unknown>) => {
              updates.push(values);
              return thenable({ error: null });
            },
          };
        }
        return {
          update: () => thenable({ error: null }),
          insert: () => thenable({ error: null }),
        };
      },
    });
  });

  it("rejeita a ação sem uma sessão de convite", async () => {
    mocks.getInviteGuestId.mockResolvedValueOnce(null);
    const response = await action({ request: request({ eventResponses: [] }) } as never);
    expect(response.status).toBe(401);
  });

  it("confirma e permite alterar a resposta posteriormente", async () => {
    const first = await action({ request: request({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 2, confirmedChildren: 1, message: "Até lá" }] }) } as never);
    const second = await action({ request: request({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 1, confirmedChildren: 0, message: "Atualizado" }] }) } as never);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(updates).toHaveLength(2);
    expect(updates[0]).toMatchObject({ status: "confirmado", confirmed_adults: 2, confirmed_children: 1, private_message: "Até lá" });
    expect(updates[1]).toMatchObject({ status: "confirmado", confirmed_adults: 1, confirmed_children: 0, private_message: "Atualizado" });
  });

  it("zera acompanhantes ao recusar", async () => {
    const response = await action({ request: request({ eventResponses: [{ eventId, status: "recusado", confirmedAdults: 2, confirmedChildren: 1, message: "Não poderemos ir" }] }) } as never);
    expect(response.status).toBe(200);
    expect(updates[0]).toMatchObject({ status: "recusado", confirmed_adults: 0, confirmed_children: 0 });
  });

  it("impede quantidades acima do limite individual", async () => {
    const response = await action({ request: request({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 3, confirmedChildren: 0, message: "" }] }) } as never);
    expect(response.status).toBe(400);
    expect(updates).toHaveLength(0);
  });
});
