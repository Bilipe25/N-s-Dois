import { createHash } from "node:crypto";
import { createServerAdminClient } from "@/lib/supabase.server";

export function assertSameOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return;

  const origin = request.headers.get("Origin");
  const expectedOrigin = new URL(request.url).origin;
  if (!origin || origin !== expectedOrigin) {
    throw Response.json({ error: "Origem da requisição não permitida." }, { status: 403 });
  }
}

function clientAddress(request: Request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Real-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function consumeRateLimit(
  request: Request,
  action: string,
  limit: number,
  windowSeconds: number,
) {
  const rateKey = createHash("sha256")
    .update(`${action}:${clientAddress(request)}`)
    .digest("hex");

  try {
    const supabase = createServerAdminClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_key: rateKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Rate limit persistente indisponível em desenvolvimento.", error);
      return true;
    }
    return false;
  }
}

export function noStoreHeaders(extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return headers;
}

export async function readJsonBody(request: Request, maxBytes = 16_384): Promise<unknown> {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw Response.json({ error: "Requisição muito grande." }, { status: 413, headers: noStoreHeaders() });
  }
  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > maxBytes) {
    throw Response.json({ error: "Requisição muito grande." }, { status: 413, headers: noStoreHeaders() });
  }
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw Response.json({ error: "JSON inválido." }, { status: 400, headers: noStoreHeaders() });
  }
}
