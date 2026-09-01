import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createPixPayload: vi.fn(),
  createServerAdminClient: vi.fn(),
  getCelebrationConfig: vi.fn(),
  getInviteGuestId: vi.fn(),
}));

vi.mock("@/lib/celebration-session.server", () => ({ getInviteGuestId: mocks.getInviteGuestId }));
vi.mock("@/lib/pix", () => ({ createPixPayload: mocks.createPixPayload }));
vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/lib/security.server", () => ({
  assertSameOrigin: vi.fn(),
  consumeRateLimit: mocks.consumeRateLimit,
  noStoreHeaders: (headers?: HeadersInit) => new Headers(headers),
  readJsonBody: (request: Request) => request.json(),
}));
vi.mock("@/services/celebration.server", () => ({ getCelebrationConfig: mocks.getCelebrationConfig }));

import { action } from "./api.public.celebration-pix-payload";

const guestId = "11111111-1111-4111-8111-111111111111";
const giftId = "22222222-2222-4222-8222-222222222222";
const reservationId = "33333333-3333-4333-8333-333333333333";

function thenable<T>(result: T) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "maybeSingle"]) chain[method] = vi.fn(() => chain);
  chain.then = (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function post(body: object) {
  return new Request("https://example.com/api/public/celebracao/pix-payload", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://example.com" },
    body: JSON.stringify(body),
  });
}

describe("payload PIX público", () => {
  let giftResult: { data: Record<string, unknown> | null; error: null };
  let reservationResult: { data: Record<string, unknown> | null; error: null };

  beforeEach(() => {
    vi.clearAllMocks();
    giftResult = {
      data: { id: giftId, price_cents: 29_900, gift_reservations: [] },
      error: null,
    };
    reservationResult = {
      data: { id: reservationId, bridal_shower_gifts: { price_cents: 29_900 } },
      error: null,
    };
    mocks.consumeRateLimit.mockResolvedValue(true);
    mocks.getInviteGuestId.mockResolvedValue(guestId);
    mocks.getCelebrationConfig.mockResolvedValue({
      pixEnabled: true,
      pixKey: "pix@example.com",
      pixRecipientName: "Gabriel e Raabe",
      pixCity: "Fortaleza",
    });
    mocks.createPixPayload.mockReturnValue("PIX_PAYLOAD");
    mocks.createServerAdminClient.mockReturnValue({
      from: (table: string) => thenable(table === "gift_reservations" ? reservationResult : giftResult),
    });
  });

  it("gera PIX geral sem valor nem referência pessoal", async () => {
    const response = await action({ request: post({}) } as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ payload: "PIX_PAYLOAD", amountCents: null });
    expect(mocks.createPixPayload).toHaveBeenCalledWith(expect.objectContaining({ amountCents: null, transactionId: "***" }));
  });

  it("gera PIX por giftId com preço exato e transaction ID do presente", async () => {
    const response = await action({ request: post({ giftId }) } as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ payload: "PIX_PAYLOAD", amountCents: 29_900 });
    expect(mocks.createPixPayload).toHaveBeenCalledWith(expect.objectContaining({
      amountCents: 29_900,
      transactionId: "PRESENTE222222222222",
    }));
  });

  it("mantém valor livre quando o presente não possui price_cents", async () => {
    giftResult.data = { id: giftId, price_cents: null, gift_reservations: [] };
    const response = await action({ request: post({ giftId }) } as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ payload: "PIX_PAYLOAD", amountCents: null });
    expect(mocks.createPixPayload).toHaveBeenCalledWith(expect.objectContaining({ amountCents: null }));
  });

  it("prefere reservationId, valida o dono e usa transaction ID da reserva", async () => {
    const response = await action({ request: post({ reservationId }) } as never);
    expect(response.status).toBe(200);
    expect(mocks.getInviteGuestId).toHaveBeenCalled();
    expect(mocks.createPixPayload).toHaveBeenCalledWith(expect.objectContaining({
      amountCents: 29_900,
      transactionId: "RESERVA333333333333",
    }));
  });

  it("não aceita reservationId sem sessão", async () => {
    mocks.getInviteGuestId.mockResolvedValueOnce(null);
    const response = await action({ request: post({ reservationId }) } as never);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Precisamos reconhecer você novamente." });
  });

  it("não revela se a reserva é inexistente ou pertence a outra pessoa", async () => {
    reservationResult.data = null;
    const response = await action({ request: post({ reservationId }) } as never);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Reserva não encontrada." });
  });

  it("bloqueia PIX específico quando outra reserva já está ativa", async () => {
    giftResult.data = {
      id: giftId,
      price_cents: 29_900,
      gift_reservations: [{ id: reservationId, status: "active" }],
    };
    const response = await action({ request: post({ giftId }) } as never);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Este presente já foi escolhido. O PIX geral continua disponível." });
    expect(mocks.createPixPayload).not.toHaveBeenCalled();
  });

  it("responde de forma segura quando PIX está incompleto ou inválido", async () => {
    mocks.getCelebrationConfig.mockResolvedValueOnce({ pixEnabled: true, pixKey: null, pixRecipientName: null, pixCity: null });
    const incomplete = await action({ request: post({}) } as never);
    expect(incomplete.status).toBe(403);

    mocks.createPixPayload.mockImplementationOnce(() => { throw new Error("inválido"); });
    const invalid = await action({ request: post({}) } as never);
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toEqual({ error: "Configuração PIX inválida." });
  });

  it("mantém rate limit com mensagem pública genérica", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce(false);
    const response = await action({ request: post({}) } as never);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Muitas tentativas." });
  });
});
