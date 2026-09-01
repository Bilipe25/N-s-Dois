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
  buildGiftNotification: ({ action, guestName, giftName }: { action: string; guestName: string; giftName: string }) => ({
    title: action === "reserved" ? "Novo presente reservado" : "Reserva de presente cancelada",
    message: `${guestName}:${giftName}`,
  }),
  notifyAdminsBestEffort: mocks.notifyAdminsBestEffort,
}));

import { action as reserveGift } from "./api.public.celebration-gift-reservations";
import { action as cancelGift } from "./api.public.celebration-gift-reservations.$id";

const guestId = "11111111-1111-4111-8111-111111111111";
const giftId = "22222222-2222-4222-8222-222222222222";
const reservationId = "33333333-3333-4333-8333-333333333333";

function thenable<T>(result: T) {
  const chain: Record<string, unknown> = {};
  for (const method of ["eq", "select", "single", "maybeSingle"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function postRequest() {
  return new Request("https://example.com/api/public/celebracao/gift-reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://example.com" },
    body: JSON.stringify({ giftId }),
  });
}

describe("reservas individuais de presentes", () => {
  let insertResult: { data: { id: string } | null; error: { code: string } | null };
  let cancelResult: { data: { id: string; gift_id: string } | null; error: null };
  let ownReservationResult: { id: string } | null;
  let insertPayload: Record<string, unknown> | null;

  beforeEach(() => {
    vi.clearAllMocks();
    insertResult = { data: { id: reservationId }, error: null };
    cancelResult = { data: { id: reservationId, gift_id: giftId }, error: null };
    ownReservationResult = null;
    insertPayload = null;
    mocks.notifyAdminsBestEffort.mockResolvedValue({ notificationId: "notification-id", pushDelivered: true });
    mocks.consumeRateLimit.mockResolvedValue(true);
    mocks.getInviteGuestId.mockResolvedValue(guestId);
    mocks.getCelebrationConfig.mockResolvedValue({ giftsEnabled: true, reservationsEnabled: true });
    mocks.celebrationIsPast.mockResolvedValue(false);
    mocks.createServerAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "bridal_shower_gifts") {
          return { select: () => thenable({ data: { id: giftId, item_name: "Jogo de panelas", image_url: null }, error: null }) };
        }
        if (table === "guests") {
          return { select: () => thenable({ data: { id: guestId, name: "Maria da Silva" }, error: null }) };
        }
        return {
          insert: (values: Record<string, unknown>) => { insertPayload = values; return thenable(insertResult); },
          update: () => thenable(cancelResult),
          select: () => thenable({ data: ownReservationResult, error: null }),
        };
      },
    });
  });

  it("exige sessão para reservar", async () => {
    mocks.getInviteGuestId.mockResolvedValueOnce(null);
    const response = await reserveGift({ request: postRequest() } as never);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Precisamos reconhecer você novamente." });
  });

  it("reserva para o convidado e retorna o identificador privado", async () => {
    const response = await reserveGift({ request: postRequest() } as never);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, reservationId });
    expect(insertPayload).toMatchObject({ gift_id: giftId, guest_id: guestId, reserved_by_name_snapshot: "Maria da Silva", status: "active" });
    expect(mocks.notifyAdminsBestEffort).toHaveBeenCalledWith(expect.objectContaining({ type: "gift", link: `/celebracao/admin?gift=${giftId}` }));
  });

  it("traduz a concorrência de reserva para conflito 409", async () => {
    insertResult = { data: null, error: { code: "23505" } };
    const response = await reserveGift({ request: postRequest() } as never);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Esse presente acabou de ser escolhido por outra pessoa." });
    expect(mocks.notifyAdminsBestEffort).not.toHaveBeenCalled();
  });

  it("trata repetição da própria reserva como idempotente", async () => {
    insertResult = { data: null, error: { code: "23505" } };
    ownReservationResult = { id: reservationId };
    const response = await reserveGift({ request: postRequest() } as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, reservationId, existing: true });
    expect(mocks.notifyAdminsBestEffort).not.toHaveBeenCalled();
  });

  it("permite cancelar a própria reserva", async () => {
    const request = new Request(`https://example.com/api/public/celebracao/gift-reservations/${reservationId}`, { method: "DELETE", headers: { Origin: "https://example.com" } });
    const response = await cancelGift({ request, params: { id: reservationId } } as never);
    expect(response.status).toBe(200);
    expect(mocks.notifyAdminsBestEffort).toHaveBeenCalledWith(expect.objectContaining({ type: "gift", link: `/celebracao/admin?gift=${giftId}` }));
  });

  it("não cancela reserva ausente ou de outro convidado", async () => {
    cancelResult = { data: null, error: null };
    const request = new Request(`https://example.com/api/public/celebracao/gift-reservations/${reservationId}`, { method: "DELETE", headers: { Origin: "https://example.com" } });
    const response = await cancelGift({ request, params: { id: reservationId } } as never);
    expect(response.status).toBe(404);
    expect(mocks.notifyAdminsBestEffort).not.toHaveBeenCalled();
  });
});
