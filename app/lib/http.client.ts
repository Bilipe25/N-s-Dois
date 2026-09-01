import { connectionFallback, responseFallback } from "@/lib/http-errors";

export class HttpRequestError extends Error {
  status: number | null;
  data: JsonErrorBody & Record<string, unknown>;

  constructor(message: string, status: number | null = null, data: JsonErrorBody & Record<string, unknown> = {}) {
    super(message);
    this.name = "HttpRequestError";
    this.status = status;
    this.data = data;
  }
}

type JsonErrorBody = { error?: unknown };

export async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 12_000,
): Promise<T> {
  const controller = new AbortController();
  const externalSignal = init.signal;
  let timedOut = false;
  const forwardAbort = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", forwardAbort, { once: true });
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const body = await response.json().catch(() => ({})) as JsonErrorBody;
    if (!response.ok) {
      const message = typeof body.error === "string" && body.error.trim()
        ? body.error
        : responseFallback(response.status);
      throw new HttpRequestError(message, response.status, body as JsonErrorBody & Record<string, unknown>);
    }
    return body as T;
  } catch (error) {
    if (error instanceof HttpRequestError) throw error;
    if (externalSignal?.aborted) throw error;
    if (timedOut) {
      throw new HttpRequestError("A conexão demorou mais que o esperado. Tente novamente.");
    }
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw new HttpRequestError(connectionFallback(offline));
  } finally {
    window.clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", forwardAbort);
  }
}
