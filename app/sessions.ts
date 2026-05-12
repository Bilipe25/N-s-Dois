import { createCookieSessionStorage } from "react-router";

type SessionData = {
    user: string;
};

type SessionFlashData = {
    error: string;
};

export const { getSession, commitSession, destroySession } =
    createCookieSessionStorage<SessionData, SessionFlashData>({
        cookie: {
            name: "__session",
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
            sameSite: "lax",
            secrets: [getSessionSecret()],
            secure: process.env.NODE_ENV === "production",
        },
    });

function getSessionSecret() {
    const secret = process.env.SESSION_SECRET;

    if (!secret && process.env.NODE_ENV === "production") {
        throw new Error("SESSION_SECRET precisa estar configurado em produção.");
    }

    return secret || "dev-only-session-secret-change-me";
}

export function getAppLoginPassword() {
    const password = process.env.APP_LOGIN_PASSWORD;

    if (!password && process.env.NODE_ENV === "production") {
        throw new Error("APP_LOGIN_PASSWORD precisa estar configurado em produção.");
    }

    return password || "2708";
}

export async function requireUserSession(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        throw Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    return user;
}
