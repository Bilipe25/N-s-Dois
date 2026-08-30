import { createCookieSessionStorage } from "react-router";
import { createHash } from "node:crypto";

type InviteSessionData = { guestId: string };

let inviteStorage: ReturnType<typeof createCookieSessionStorage<InviteSessionData>> | undefined;

function storage() {
  if (inviteStorage) return inviteStorage;

  const baseSecret = process.env.INVITE_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!baseSecret || baseSecret.length < 32 || new Set(baseSecret).size < 12) {
    throw new Error("INVITE_SESSION_SECRET ou SESSION_SECRET forte, com 32+ caracteres, é obrigatório.");
  }

  const derivedSecret = createHash("sha256")
    .update(`celebration-invite:${baseSecret}`)
    .digest("hex");

  inviteStorage = createCookieSessionStorage<InviteSessionData>({
    cookie: {
      name: "__celebration_invite",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secrets: [derivedSecret],
      secure: process.env.NODE_ENV === "production",
    },
  });

  return inviteStorage;
}

export async function getInviteGuestId(request: Request) {
  const session = await storage().getSession(request.headers.get("Cookie"));
  return session.get("guestId") || null;
}

export async function createInviteSession(request: Request, guestId: string) {
  const session = await storage().getSession(request.headers.get("Cookie"));
  session.set("guestId", guestId);
  return storage().commitSession(session);
}

export async function clearInviteSession(request: Request) {
  const session = await storage().getSession(request.headers.get("Cookie"));
  return storage().destroySession(session);
}
