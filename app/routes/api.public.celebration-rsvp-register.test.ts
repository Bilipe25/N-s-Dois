import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  celebrationIsPast: vi.fn(), consumeRateLimit: vi.fn(), createInviteSession: vi.fn(),
  createServerAdminClient: vi.fn(), getCelebrationConfig: vi.fn(),
}));

vi.mock("@/lib/celebration-session.server", () => ({ createInviteSession: mocks.createInviteSession }));
vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/lib/security.server", () => ({
  assertSameOrigin: vi.fn(), consumeRateLimit: mocks.consumeRateLimit,
  noStoreHeaders: (headers?: HeadersInit) => new Headers(headers),
  readJsonBody: (request: Request) => request.json(),
}));
vi.mock("@/services/celebration.server", () => ({ celebrationIsPast: mocks.celebrationIsPast, getCelebrationConfig: mocks.getCelebrationConfig }));

import { action } from "./api.public.celebration-rsvp-register";

function request(body: unknown) {
  return new Request("https://example.com/api/public/celebracao/rsvp/register", { method: "POST", headers: { Origin: "https://example.com", "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

function client(existing: Array<{ id: string }> = [], rpcResult = { data: "11111111-1111-4111-8111-111111111111", error: null }) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "limit"]) chain[method] = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: existing, error: null }).then(resolve);
  return { from: vi.fn(() => chain), rpc: vi.fn().mockResolvedValue(rpcResult) };
}

describe("cadastro espontâneo de RSVP", () => {
  beforeEach(() => {
    mocks.consumeRateLimit.mockResolvedValue(true);
    mocks.getCelebrationConfig.mockResolvedValue({ rsvpEnabled: true });
    mocks.celebrationIsPast.mockResolvedValue(false);
    mocks.createInviteSession.mockResolvedValue("session=cookie");
  });

  it("cria o cadastro marcado e inicia uma sessão privada", async () => {
    const db = client(); mocks.createServerAdminClient.mockReturnValue(db);
    const response = await action({ request: request({ name: "  Maria   da Silva ", status: "confirmado", confirmedAdults: 2, confirmedChildren: 1, phone: "(79) 99999-9999", message: "Até lá" }) } as never);
    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toBe("session=cookie");
    expect(db.rpc).toHaveBeenCalledWith("create_public_rsvp_guest", expect.objectContaining({ p_name: "Maria da Silva", p_adults: 2, p_children: 1, p_phone: "79999999999" }));
  });

  it("impede duplicidade sem expor o cadastro encontrado", async () => {
    mocks.createServerAdminClient.mockReturnValue(client([{ id: "existing" }]));
    const response = await action({ request: request({ name: "Maria da Silva", status: "confirmado", confirmedAdults: 1, confirmedChildren: 0 }) } as never);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ status: "already_exists" });
  });

  it("rejeita limites públicos acima de seis antes de acessar o banco", async () => {
    const db = client(); mocks.createServerAdminClient.mockReturnValue(db);
    const response = await action({ request: request({ name: "Maria da Silva", status: "confirmado", confirmedAdults: 7, confirmedChildren: 0 }) } as never);
    expect(response.status).toBe(400);
    expect(db.from).not.toHaveBeenCalled();
  });
});
