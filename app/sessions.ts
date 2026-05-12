import { createCookieSessionStorage } from "react-router";

type SessionData = {
    user: string;
};

type SessionFlashData = {
    error: string;
};

const FALLBACK_SESSION_SECRET = "s3cr3t-k3y-nos-dois";
const FALLBACK_LOGIN_PASSWORD = "2708";
let warnedMissingSessionSecret = false;
let warnedMissingLoginPassword = false;

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

    if (!secret && process.env.NODE_ENV === "production" && !warnedMissingSessionSecret) {
        warnedMissingSessionSecret = true;
        console.warn("SESSION_SECRET não configurado. Usando fallback legado; configure essa env no Vercel.");
    }

    return secret || FALLBACK_SESSION_SECRET;
}

export function getAppLoginPassword() {
    const password = process.env.APP_LOGIN_PASSWORD;

    if (!password && process.env.NODE_ENV === "production" && !warnedMissingLoginPassword) {
        warnedMissingLoginPassword = true;
        console.warn("APP_LOGIN_PASSWORD não configurado. Usando senha legada; configure essa env no Vercel.");
    }

    return password || FALLBACK_LOGIN_PASSWORD;
}

export async function requireUserSession(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        throw Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    return user;
}
