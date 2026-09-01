import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createInviteSession: vi.fn(),
  createServerAdminClient: vi.fn(),
}));

vi.mock("@/lib/celebration-session.server", () => ({ createInviteSession: mocks.createInviteSession }));
vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/lib/security.server", () => ({
  assertSameOrigin: vi.fn(), consumeRateLimit: mocks.consumeRateLimit,
  noStoreHeaders: (headers?: HeadersInit) => new Headers(headers),
  readJsonBody: (request: Request) => request.json(),
}));

import { action } from "./api.public.celebration-rsvp-identify";

function request(name: string) {
  return new Request("https://example.com/api/public/celebracao/rsvp/identify", { method: "POST", headers: { Origin: "https://example.com", "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
}

function client(rows: Array<{ id: string; name: string }>) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "limit"]) chain[method] = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve);
  return { from: vi.fn(() => chain), chain };
}

describe("identificação privada por nome", () => {
  beforeEach(() => { mocks.consumeRateLimit.mockResolvedValue(true); mocks.createInviteSession.mockResolvedValue("session=cookie"); });

  it("normaliza acentos e cria a sessão quando há um único resultado", async () => {
    const db = client([{ id: "11111111-1111-4111-8111-111111111111", name: "João Ávila" }]);
    mocks.createServerAdminClient.mockReturnValue(db);
    const response = await action({ request: request("  JOAO   AVILA ") } as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBe("session=cookie");
    expect(db.chain.limit).toHaveBeenCalledWith(1000);
    expect(await response.json()).toEqual({ status: "found", displayName: "João Ávila" });
  });

  it("aceita variações seguras de hífen e apóstrofo sem devolver candidatos", async () => {
    mocks.createServerAdminClient.mockReturnValue(client([{ id: "11111111-1111-4111-8111-111111111111", name: "Ana-Maria D’Ávila" }]));
    const response = await action({ request: request("ana maria d avila") } as never);
    expect(await response.json()).toEqual({ status: "found", displayName: "Ana-Maria D’Ávila" });
  });

  it("não retorna candidatos quando não encontra ou há homônimos", async () => {
    mocks.createServerAdminClient.mockReturnValueOnce(client([]));
    const missing = await action({ request: request("Nome Ausente") } as never);
    expect(await missing.json()).toEqual({ status: "not_found" });
    mocks.createServerAdminClient.mockReturnValueOnce(client([{ id: "1", name: "Ana Silva" }, { id: "2", name: "Ana-Silva" }]));
    const duplicate = await action({ request: request("Ana Silva") } as never);
    expect(await duplicate.json()).toEqual({ status: "ambiguous" });
  });

  it("bloqueia excesso de tentativas", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce(false);
    expect((await action({ request: request("Maria Silva") } as never)).status).toBe(429);
  });
});
