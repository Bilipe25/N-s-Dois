import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createServerAdminClient: vi.fn(),
  requireUserSession: vi.fn(),
}));

vi.mock("@/sessions", () => ({ requireUserSession: mocks.requireUserSession }));
vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/lib/security.server", () => ({
  assertSameOrigin: vi.fn(),
  consumeRateLimit: mocks.consumeRateLimit,
  noStoreHeaders: (headers?: HeadersInit) => new Headers(headers),
  readJsonBody: (request: Request) => request.json(),
}));

import { action } from "./api.admin.celebration-media";

const heroPath = "hero/550e8400-e29b-41d4-a716-446655440000.webp";
const ogPath = "og/550e8400-e29b-41d4-a716-446655440000.jpg";
const projectUrl = "https://project.supabase.co";

function post(body: object) {
  return new Request("https://example.com/api/admin/celebracao/media", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://example.com" },
    body: JSON.stringify(body),
  });
}

function webp(width = 1600, height = 900) {
  const bytes = new Uint8Array(30);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  bytes.set(new TextEncoder().encode("WEBP"), 8);
  bytes.set(new TextEncoder().encode("VP8X"), 12);
  width -= 1;
  height -= 1;
  bytes.set([width & 0xff, (width >> 8) & 0xff, (width >> 16) & 0xff], 24);
  bytes.set([height & 0xff, (height >> 8) & 0xff, (height >> 16) & 0xff], 27);
  return bytes;
}

function jpeg(width = 1200, height = 630) {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, (height >> 8) & 0xff, height & 0xff, (width >> 8) & 0xff, width & 0xff, 0x03, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0, 0xff, 0xd9]);
}

describe("API administrativa de mídia da celebração", () => {
  let config: { id: string; celebration_hero_url: string | null; celebration_og_url: string | null };
  let updateError: { message: string } | null;
  let downloadBytes: Uint8Array;
  const updates: Record<string, unknown>[] = [];
  const remove = vi.fn();
  const createSignedUploadUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = projectUrl;
    config = { id: "config-id", celebration_hero_url: "https://images.example.com/legacy.jpg", celebration_og_url: null };
    updateError = null;
    downloadBytes = webp();
    updates.length = 0;
    mocks.requireUserSession.mockResolvedValue("gabriel");
    mocks.consumeRateLimit.mockResolvedValue(true);
    remove.mockResolvedValue({ error: null });
    createSignedUploadUrl.mockResolvedValue({ data: { token: "signed-token" }, error: null });

    const storage = {
      createSignedUploadUrl,
      download: vi.fn(async () => {
        const body = new ArrayBuffer(downloadBytes.byteLength);
        new Uint8Array(body).set(downloadBytes);
        return { data: new Blob([body]), error: null };
      }),
      getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `${projectUrl}/storage/v1/object/public/celebration-media/${path}` } })),
      remove,
    };
    mocks.createServerAdminClient.mockReturnValue({
      storage: { from: vi.fn(() => storage) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({ limit: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: config, error: null })) })) })),
        update: vi.fn((values: Record<string, unknown>) => {
          updates.push(values);
          return {
            eq: vi.fn(async () => ({ error: updateError })),
            not: vi.fn(async () => ({ error: updateError })),
          };
        }),
      })),
    });
  });

  it("exige uma sessão administrativa", async () => {
    mocks.requireUserSession.mockRejectedValueOnce(Response.json({ error: "Não autenticado." }, { status: 401 }));
    await expect(action({ request: post({ intent: "prepare", kind: "hero" }) } as never)).rejects.toMatchObject({ status: 401 });
  });

  it("prepara somente um path UUID e um token de upload assinado", async () => {
    const response = await action({ request: post({ intent: "prepare", kind: "hero" }) } as never);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.path).toMatch(/^hero\/[0-9a-f-]+\.webp$/);
    expect(body.token).toBe("signed-token");
    expect(createSignedUploadUrl).toHaveBeenCalledWith(body.path, { upsert: false });
  });

  it("rejeita configuração inválida e limita excesso de operações", async () => {
    const invalid = await action({ request: post({ intent: "finalize", kind: "hero", path: "../hero.webp" }) } as never);
    expect(invalid.status).toBe(400);

    mocks.consumeRateLimit.mockResolvedValueOnce(false);
    const limited = await action({ request: post({ intent: "prepare", kind: "hero" }) } as never);
    expect(limited.status).toBe(429);
  });

  it("publica o novo Hero antes do cleanup e preserva URL externa antiga", async () => {
    const response = await action({ request: post({ intent: "finalize", kind: "hero", path: heroPath }) } as never);
    expect(response.status).toBe(200);
    expect(updates).toContainEqual({ celebration_hero_url: `${projectUrl}/storage/v1/object/public/celebration-media/${heroPath}` });
    expect(remove).not.toHaveBeenCalled();
  });

  it("publica OG JPEG normalizada e remove apenas o objeto controlado anterior", async () => {
    config.celebration_og_url = `${projectUrl}/storage/v1/object/public/celebration-media/og/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`;
    downloadBytes = jpeg();
    const response = await action({ request: post({ intent: "finalize", kind: "og", path: ogPath }) } as never);
    expect(response.status).toBe(200);
    expect(updates).toContainEqual({ celebration_og_url: `${projectUrl}/storage/v1/object/public/celebration-media/${ogPath}` });
    expect(remove).toHaveBeenCalledWith(["og/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg"]);
  });

  it("rejeita tipo inválido e descarta o candidato sem alterar a imagem publicada", async () => {
    downloadBytes = jpeg(1600, 900);
    const response = await action({ request: post({ intent: "finalize", kind: "hero", path: heroPath }) } as never);
    expect(response.status).toBe(422);
    expect(updates).toHaveLength(0);
    expect(remove).toHaveBeenCalledWith([heroPath]);
  });

  it("mantém a imagem anterior quando a atualização do banco falha", async () => {
    updateError = { message: "database unavailable" };
    const response = await action({ request: post({ intent: "finalize", kind: "hero", path: heroPath }) } as never);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Não conseguimos publicar a imagem. A anterior continua ativa." });
    expect(remove).toHaveBeenCalledWith([heroPath]);
  });

  it("remove a URL do banco antes de tentar apagar um arquivo físico controlado", async () => {
    config.celebration_hero_url = `${projectUrl}/storage/v1/object/public/celebration-media/${heroPath}`;
    const response = await action({ request: post({ intent: "remove", kind: "hero" }) } as never);
    expect(response.status).toBe(200);
    expect(updates[0]).toEqual({ celebration_hero_url: null });
    expect(remove).toHaveBeenCalledWith([heroPath]);
  });

  it("remove a OG personalizada sem afetar o Hero", async () => {
    config.celebration_og_url = `${projectUrl}/storage/v1/object/public/celebration-media/${ogPath}`;
    const response = await action({ request: post({ intent: "remove", kind: "og" }) } as never);
    expect(response.status).toBe(200);
    expect(updates[0]).toEqual({ celebration_og_url: null });
    expect(updates[0]).not.toHaveProperty("celebration_hero_url");
  });

  it("salva o ponto focal sem reescrever URLs", async () => {
    const response = await action({ request: post({ intent: "update_focus", x: 37, y: 62 }) } as never);
    expect(response.status).toBe(200);
    expect(updates[0]).toEqual({ celebration_hero_focal_x: 37, celebration_hero_focal_y: 62 });
    expect(updates[0]).not.toHaveProperty("celebration_hero_url");
  });
});
