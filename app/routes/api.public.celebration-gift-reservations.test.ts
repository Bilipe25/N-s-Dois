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
  let cancelResult: { data: { id: string } | null; error: null };

  beforeEach(() => {
    insertResult = { data: { id: reservationId }, error: null };
    cancelResult = { data: { id: reservationId }, error: null };
    mocks.consumeRateLimit.mockResolvedValue(true);
    mocks.getInviteGuestId.mockResolvedValue(guestId);
    mocks.getCelebrationConfig.mockResolvedValue({ giftsEnabled: true, reservationsEnabled: true });
    mocks.celebrationIsPast.mockResolvedValue(false);
    mocks.createServerAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "bridal_shower_gifts") {
          return { select: () => thenable({ data: { id: giftId }, error: null }) };
        }
        return {
          insert: () => thenable(insertResult),
          update: () => thenable(cancelResult),
        };
      },
    });
  });

  it("exige sessão para reservar", async () => {
    mocks.getInviteGuestId.mockResolvedValueOnce(null);
    const response = await reserveGift({ request: postRequest() } as never);
    expect(response.status).toBe(401);
  });

  it("reserva para o convidado e retorna o identificador privado", async () => {
    const response = await reserveGift({ request: postRequest() } as never);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, reservationId });
  });

  it("traduz a concorrência de reserva para conflito 409", async () => {
    insertResult = { data: null, error: { code: "23505" } };
    const response = await reserveGift({ request: postRequest() } as never);
    expect(response.status).toBe(409);
  });

  it("permite cancelar a própria reserva", async () => {
    const request = new Request(`https://example.com/api/public/celebracao/gift-reservations/${reservationId}`, { method: "DELETE", headers: { Origin: "https://example.com" } });
    const response = await cancelGift({ request, params: { id: reservationId } } as never);
    expect(response.status).toBe(200);
  });

  it("não cancela reserva ausente ou de outro convidado", async () => {
    cancelResult = { data: null, error: null };
    const request = new Request(`https://example.com/api/public/celebracao/gift-reservations/${reservationId}`, { method: "DELETE", headers: { Origin: "https://example.com" } });
    const response = await cancelGift({ request, params: { id: reservationId } } as never);
    expect(response.status).toBe(404);
  });
});
