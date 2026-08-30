import { describe, expect, it } from "vitest";
import { generateInviteToken, hashInviteToken, isValidInviteToken } from "./invite-token";

describe("invite tokens", () => {
  it("gera tokens opacos de 256 bits no formato aceito", () => {
    const first = generateInviteToken();
    const second = generateInviteToken();

    expect(first.rawToken).toHaveLength(43);
    expect(isValidInviteToken(first.rawToken)).toBe(true);
    expect(first.tokenHash).toBe(hashInviteToken(first.rawToken));
    expect(first.rawToken).not.toBe(second.rawToken);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejeita tokens fora do contrato", () => {
    expect(isValidInviteToken("curto")).toBe(false);
    expect(isValidInviteToken("a".repeat(42))).toBe(false);
    expect(isValidInviteToken(`${"a".repeat(42)}!`)).toBe(false);
  });
});
