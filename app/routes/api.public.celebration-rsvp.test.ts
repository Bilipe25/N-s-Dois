import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  celebrationIsPast: vi.fn(),
  consumeRateLimit: vi.fn(),
  createServerAdminClient: vi.fn(),
  getCelebrationConfig: vi.fn(),
  getInviteGuestId: vi.fn(),
  notifyAdminsBestEffort: vi.fn(),
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
vi.mock("@/services/admin-notifications.server", () => ({
  buildRsvpNotification: ({ name, status }: { name: string; status: string }) => ({ title: status, message: name }),
  notifyAdminsBestEffort: mocks.notifyAdminsBestEffort,
}));

import { action } from "./api.public.celebration-rsvp";

const guestId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const secondEventId = "44444444-4444-4444-8444-444444444444";
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
    vi.clearAllMocks();
    updates.length = 0;
    mocks.consumeRateLimit.mockResolvedValue(true);
    mocks.getInviteGuestId.mockResolvedValue(guestId);
    mocks.getCelebrationConfig.mockResolvedValue({ rsvpEnabled: true, publicRsvpAdultLimit: 6, publicRsvpChildLimit: 6 });
    mocks.celebrationIsPast.mockResolvedValue(false);
    mocks.notifyAdminsBestEffort.mockResolvedValue({ notificationId: "notification-id", pushDelivered: true });
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
        if (table === "guests") return {
          update: () => thenable({ error: null }),
          select: () => thenable({ data: { name: "Maria da Silva", source: "admin" }, error: null }),
        };
        return { insert: () => thenable({ error: null }) };
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
    expect(mocks.notifyAdminsBestEffort).toHaveBeenCalledTimes(2);
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

  it("exige ao menos um adulto mesmo quando há crianças", async () => {
    const response = await action({ request: request({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 0, confirmedChildren: 1, message: "" }] }) } as never);
    expect(response.status).toBe(400);
    expect(updates).toHaveLength(0);
  });

  it("usa os limites configurados para uma resposta espontânea já identificada", async () => {
    mocks.getCelebrationConfig.mockResolvedValue({ rsvpEnabled: true, publicRsvpAdultLimit: 2, publicRsvpChildLimit: 1 });
    mocks.createServerAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "guests") return {
          select: () => thenable({ data: { id: guestId, source: "public_rsvp", adults_count: 1, children_count: 0, rsvp_status: "pendente", rsvp_adults: 0, rsvp_children: 0, rsvp_message: null }, error: null }),
          update: (values: Record<string, unknown>) => { updates.push(values); return thenable({ error: null }); },
        };
        return { insert: () => thenable({ error: null }) };
      },
    });
    const response = await action({ request: request({ generalResponse: { status: "confirmado", confirmedAdults: 3, confirmedChildren: 0, message: "" } }) } as never);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Sua resposta permite até 2 adultos e 1 criança." });
    expect(updates).toHaveLength(0);
  });

  it("trata a repetição da mesma resposta como idempotente", async () => {
    mocks.createServerAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "guest_event_rsvps") return {
          select: () => thenable({ data: [{ id: rsvpId, event_id: eventId, adult_limit: 2, child_limit: 1, status: "confirmado", confirmed_adults: 1, confirmed_children: 0, private_message: "Até lá" }], error: null }),
          update: (values: Record<string, unknown>) => { updates.push(values); return thenable({ error: null }); },
        };
        return { update: () => thenable({ error: null }), insert: () => thenable({ error: null }) };
      },
    });
    const response = await action({ request: request({ eventResponses: [{ eventId, status: "confirmado", confirmedAdults: 1, confirmedChildren: 0, message: "Até lá" }] }) } as never);
    expect(await response.json()).toEqual({ success: true, updated: false });
    expect(updates).toHaveLength(0);
    expect(mocks.notifyAdminsBestEffort).not.toHaveBeenCalled();
  });

  it("preserva respostas por evento e consolida pessoas pelo maior valor, sem somar", async () => {
    const guestUpdates: Array<Record<string, unknown>> = [];
    mocks.createServerAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "guest_event_rsvps") return {
          select: () => thenable({ data: [
            { id: rsvpId, event_id: eventId, adult_limit: 4, child_limit: 3, status: "pendente", confirmed_adults: 0, confirmed_children: 0, private_message: null },
            { id: "55555555-5555-4555-8555-555555555555", event_id: secondEventId, adult_limit: 4, child_limit: 3, status: "pendente", confirmed_adults: 0, confirmed_children: 0, private_message: null },
          ], error: null }),
          update: (values: Record<string, unknown>) => { updates.push(values); return thenable({ error: null }); },
        };
        if (table === "guests") return {
          update: (values: Record<string, unknown>) => { guestUpdates.push(values); return thenable({ error: null }); },
          select: () => thenable({ data: { name: "Maria da Silva", source: "admin" }, error: null }),
        };
        return { insert: () => thenable({ error: null }) };
      },
    });

    const response = await action({ request: request({ eventResponses: [
      { eventId, status: "confirmado", confirmedAdults: 2, confirmedChildren: 1, message: "Cerimônia" },
      { eventId: secondEventId, status: "confirmado", confirmedAdults: 3, confirmedChildren: 0, message: "Recepção" },
    ] }) } as never);

    expect(response.status).toBe(200);
    expect(updates).toHaveLength(2);
    expect(guestUpdates[0]).toMatchObject({ rsvp_adults: 3, rsvp_children: 1 });
  });
});
