import { createCookieSessionStorage } from "react-router";
import { promisify } from "node:util";
import { scrypt, timingSafeEqual } from "node:crypto";

type SessionData = {
    user: string;
};

type SessionFlashData = {
    error: string;
};

let sessionStorage: ReturnType<typeof createCookieSessionStorage<SessionData, SessionFlashData>> | undefined;

function isStrongSecret(value: string | undefined): value is string {
    return Boolean(value && value.length >= 32 && new Set(value).size >= 12);
}

function getStorage() {
    if (sessionStorage) return sessionStorage;
    const secret = process.env.SESSION_SECRET;
    if (!isStrongSecret(secret)) {
        throw new Error("SESSION_SECRET forte, com 32+ caracteres e boa diversidade, é obrigatório.");
    }

    sessionStorage = createCookieSessionStorage<SessionData, SessionFlashData>({
        cookie: {
            name: "__session",
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
            sameSite: "lax",
            secrets: [secret],
            secure: process.env.NODE_ENV === "production",
        },
    });
    return sessionStorage;
}

export const getSession = (...args: Parameters<ReturnType<typeof getStorage>["getSession"]>) =>
    getStorage().getSession(...args);
export const commitSession = (...args: Parameters<ReturnType<typeof getStorage>["commitSession"]>) =>
    getStorage().commitSession(...args);
export const destroySession = (...args: Parameters<ReturnType<typeof getStorage>["destroySession"]>) =>
    getStorage().destroySession(...args);

const scryptAsync = promisify(scrypt);

export async function verifyAdminPassword(name: string, password: string) {
    const normalizedName = name.trim().toLowerCase();
    const envName = normalizedName === "gabriel"
        ? "ADMIN_GABRIEL_PASSWORD_HASH"
        : normalizedName === "raabe"
            ? "ADMIN_RAABE_PASSWORD_HASH"
            : null;

    if (!envName) return false;
    const gabrielHash = process.env.ADMIN_GABRIEL_PASSWORD_HASH;
    const raabeHash = process.env.ADMIN_RAABE_PASSWORD_HASH;
    if (!gabrielHash || !raabeHash || gabrielHash === raabeHash) {
        throw new Error("Hashes scrypt distintos para Gabriel e Raabe são obrigatórios.");
    }
    const encoded = envName === "ADMIN_GABRIEL_PASSWORD_HASH" ? gabrielHash : raabeHash;

    const [algorithm, saltEncoded, hashEncoded] = encoded.split("$");
    if (algorithm !== "scrypt" || !saltEncoded || !hashEncoded) {
        throw new Error(`${envName} deve usar o formato scrypt$<salt-base64>$<hash-base64>.`);
    }

    const salt = Buffer.from(saltEncoded, "base64");
    const expected = Buffer.from(hashEncoded, "base64");
    if (salt.length < 16 || expected.length < 32) return false;
    const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function requireUserSession(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        throw Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    return user;
}
