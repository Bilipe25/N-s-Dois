import { beforeAll, describe, expect, it } from "vitest";

describe("celebration invite session", () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = "convite-de-teste-com-entropia-suficiente-2026-xyz";
  });

  it("cria cookie HttpOnly e permite encerrá-lo", async () => {
    const { clearInviteSession, createInviteSession, getInviteGuestId } = await import("./celebration-session.server");
    const guestId = "11111111-1111-4111-8111-111111111111";
    const request = new Request("https://example.com/celebracao");
    const setCookie = await createInviteSession(request, guestId);

    expect(setCookie).toContain("__celebration_invite=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");

    const cookieHeader = setCookie.split(";")[0];
    const authenticatedRequest = new Request("https://example.com/celebracao", { headers: { Cookie: cookieHeader } });
    expect(await getInviteGuestId(authenticatedRequest)).toBe(guestId);

    const cleared = await clearInviteSession(authenticatedRequest);
    expect(cleared).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  });
});
