import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createInviteSession: vi.fn(),
  createServerAdminClient: vi.fn(),
}));

vi.mock("@/lib/celebration-session.server", () => ({ createInviteSession: mocks.createInviteSession }));
vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/lib/security.server", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  noStoreHeaders: (headers?: HeadersInit) => new Headers({ "Cache-Control": "no-store", ...Object.fromEntries(new Headers(headers).entries()) }),
}));

import { loader } from "./celebration.invite.$token";

const token = "A".repeat(43);
const guestId = "11111111-1111-4111-8111-111111111111";
const inviteId = "22222222-2222-4222-8222-222222222222";

function thenable<T>(result: T) {
  const chain: Record<string, unknown> = {};
  for (const method of ["eq", "is", "maybeSingle"]) chain[method] = vi.fn(() => chain);
  chain.then = (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

describe("troca segura do token de convite", () => {
  let invite: { id: string; guest_id: string } | null;

  beforeEach(() => {
    invite = { id: inviteId, guest_id: guestId };
    mocks.consumeRateLimit.mockResolvedValue(true);
    mocks.createInviteSession.mockResolvedValue("__celebration_invite=signed; HttpOnly; SameSite=Lax");
    mocks.createServerAdminClient.mockReturnValue({
      from: () => ({
        select: () => thenable({ data: invite, error: null }),
        update: () => thenable({ error: null }),
      }),
    });
  });

  it("rejeita token malformado sem criar sessão", async () => {
    const response = await loader({ request: new Request("https://example.com/celebracao/convite/curto"), params: { token: "curto" } } as never);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/celebracao?convite=invalido");
    expect(mocks.createInviteSession).not.toHaveBeenCalled();
  });

  it("trata link revogado como inválido", async () => {
    invite = null;
    const response = await loader({ request: new Request(`https://example.com/celebracao/convite/${token}`), params: { token } } as never);
    expect(response.headers.get("Location")).toBe("/celebracao?convite=invalido");
    expect(response.headers.has("Set-Cookie")).toBe(false);
  });

  it("cria cookie HttpOnly e remove o token da URL pelo redirect", async () => {
    const response = await loader({ request: new Request(`https://example.com/celebracao/convite/${token}`), params: { token } } as never);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/celebracao");
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.createInviteSession).toHaveBeenCalledWith(expect.any(Request), guestId);
  });
});
