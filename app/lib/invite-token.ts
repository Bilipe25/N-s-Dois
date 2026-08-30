import { createHash, randomBytes } from "node:crypto";

const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isValidInviteToken(token: string) {
  return INVITE_TOKEN_PATTERN.test(token);
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInviteToken() {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashInviteToken(rawToken) };
}
