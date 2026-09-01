import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerAdminClient: vi.fn(),
  requireUserSession: vi.fn(),
}));

vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/sessions", () => ({ requireUserSession: mocks.requireUserSession }));
vi.mock("@/lib/security.server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/security.server")>("@/lib/security.server");
  return { ...actual, assertSameOrigin: vi.fn(), readJsonBody: (request: Request) => request.json() };
});

import { action, loader } from "./api.admin.celebration-gifts";

const giftId = "11111111-1111-4111-8111-111111111111";
const secondGiftId = "22222222-2222-4222-8222-222222222222";
const reservationId = "33333333-3333-4333-8333-333333333333";
const secondReservationId = "44444444-4444-4444-8444-444444444444";
const guestId = "55555555-5555-4555-8555-555555555555";

function resolvedChain<T>(value: T, methods: string[]) {
  const chain: Record<string, unknown> = {};
  for (const method of methods) chain[method] = vi.fn(() => chain);
  chain.then = (resolve: (result: T) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return chain;
}

describe("administração canônica de reservas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserSession.mockResolvedValue("gabriel");
  });

  it("enriquece presentes com reservas ativas e nomes em uma única consulta de convidados", async () => {
    const guestQuery = resolvedChain({ data: [{
      id: guestId,
      name: " Maria da Silva ",
      contact_phone: "(82) 99999-9999",
      rsvp_status: "confirmado",
      rsvp_adults: 2,
      rsvp_children: 1,
      adults_count: 1,
      children_count: 0,
    }], error: null }, ["in"]);
    const from = vi.fn((table: string) => {
      if (table === "bridal_shower_gifts") return { select: () => resolvedChain({ data: [
        { id: giftId, item_name: "Faqueiro", status: "disponivel" },
        { id: secondGiftId, item_name: "Jogo de cama", status: "comprado" },
      ], error: null }, ["order"]) };
      if (table === "app_config") return { select: () => resolvedChain({ data: { id: "config" }, error: null }, ["single"]) };
      if (table === "gift_reservations") return { select: () => resolvedChain({ data: [
        { id: reservationId, gift_id: giftId, guest_id: guestId, reserved_by_name_snapshot: null, reserved_at: "2026-09-01T12:00:00Z", legacy_source: false },
        { id: secondReservationId, gift_id: secondGiftId, guest_id: null, reserved_by_name_snapshot: "Registro legado", reserved_at: "2025-01-01T12:00:00Z", legacy_source: true },
      ], error: null }, ["eq", "order"]) };
      if (table === "guests") return { select: vi.fn(() => guestQuery) };
      throw new Error(`Tabela inesperada: ${table}`);
    });
    mocks.createServerAdminClient.mockReturnValue({ from });

    const result = await loader({ request: new Request("https://example.com/api/admin/celebracao/gifts") } as never);
    expect(result.gifts[0].active_reservation).toMatchObject({
      id: reservationId,
      guest_name: "Maria da Silva",
      guest_phone: "(82) 99999-9999",
      guest_rsvp_status: "confirmado",
      guest_adults: 2,
      guest_children: 1,
      legacy_source: false,
    });
    expect(result.gifts[1].active_reservation).toMatchObject({
      id: secondReservationId,
      guest_name: "Registro legado",
      guest_phone: null,
      guest_rsvp_status: "pendente",
      legacy_source: true,
    });
    expect(from.mock.calls.filter(([table]) => table === "guests")).toHaveLength(1);
  });

  it("cancela somente uma reserva ainda ativa", async () => {
    const updateValues: Record<string, unknown>[] = [];
    const updateChain = resolvedChain({ data: { id: reservationId }, error: null }, ["eq", "select", "maybeSingle"]);
    mocks.createServerAdminClient.mockReturnValue({
      from: vi.fn(() => ({ update: vi.fn((values: Record<string, unknown>) => { updateValues.push(values); return updateChain; }) })),
    });
    const request = new Request("https://example.com/api/admin/celebracao/gifts?intent=cancel_gift_reservation", {
      method: "PUT",
      headers: { Origin: "https://example.com", "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });
    const response = await action({ request } as never);
    expect(response).toEqual({ success: true });
    expect(updateValues[0]).toMatchObject({ status: "cancelled", cancelled_at: expect.any(String) });
  });

  it("rejeita o antigo status manual como contrato encerrado", async () => {
    mocks.createServerAdminClient.mockReturnValue({ from: vi.fn() });
    const request = new Request("https://example.com/api/admin/celebracao/gifts?intent=toggle_gift_status", {
      method: "PUT",
      headers: { Origin: "https://example.com", "Content-Type": "application/json" },
      body: JSON.stringify({ id: giftId, currentStatus: "disponivel" }),
    });
    const response = await action({ request } as never);
    expect(response).toMatchObject({ init: { status: 410 } });
  });
});
