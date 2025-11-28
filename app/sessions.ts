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
            secrets: ["s3cr3t-k3y-nos-dois"], // Em produção deveria ser env var, mas ok para este caso
            secure: process.env.NODE_ENV === "production",
        },
    });
