import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerAdminClient: vi.fn(),
  requireUserSession: vi.fn(),
}));

vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/sessions", () => ({ requireUserSession: mocks.requireUserSession }));

import { loader } from "./api.guests";

function resolvedChain<T>(value: T, methods: string[]) {
  const chain: Record<string, unknown> = {};
  for (const method of methods) chain[method] = vi.fn(() => chain);
  chain.then = (resolve: (result: T) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return chain;
}

describe("dados administrativos de convidados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserSession.mockResolvedValue("gabriel");
  });

  it("entrega telefone e somente presentes vinculados por reservas ativas", async () => {
    const guestId = "11111111-1111-4111-8111-111111111111";
    const reservationId = "22222222-2222-4222-8222-222222222222";
    const from = vi.fn((table: string) => {
      if (table === "guests") return { select: () => resolvedChain({ data: [{
        id: guestId,
        created_at: "2026-09-01T12:00:00Z",
        name: "Maria da Silva",
        group_name: "Amigos Noivo",
        adults_count: 2,
        children_count: 1,
        rsvp_status: "confirmado",
        contact_phone: " (82) 99999-9999 ",
        guest_event_rsvps: [],
      }], error: null }, ["order"]) };
      if (table === "guest_invite_tokens") return { select: () => resolvedChain({ data: [], error: null }, ["is"]) };
      if (table === "gift_reservations") return { select: () => resolvedChain({ data: [{
        id: reservationId,
        guest_id: guestId,
        bridal_shower_gifts: { item_name: " Air Fryer " },
      }], error: null }, ["eq", "not"]) };
      throw new Error(`Tabela inesperada: ${table}`);
    });
    mocks.createServerAdminClient.mockReturnValue({ from });

    const response = await loader({ request: new Request("https://example.com/api/guests") } as never);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.guests[0]).toMatchObject({
      phone: "(82) 99999-9999",
      reserved_gifts: [{ id: reservationId, item_name: "Air Fryer" }],
    });
    expect(mocks.requireUserSession).toHaveBeenCalledOnce();
  });
});
