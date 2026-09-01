import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import {
  CELEBRATION_MEDIA_BUCKET,
  CELEBRATION_MEDIA_CACHE_SECONDS,
  controlledMediaPathFromUrl,
  createCelebrationMediaPath,
  isExpectedCelebrationMediaPath,
  mediaRule,
  type CelebrationMediaKind,
  validateFinalCelebrationMedia,
} from "@/lib/celebration-media.server";
import { assertSameOrigin, consumeRateLimit, noStoreHeaders, readJsonBody } from "@/lib/security.server";
import { createServerAdminClient } from "@/lib/supabase.server";
import { requireUserSession } from "@/sessions";

const PrepareSchema = z.object({ intent: z.literal("prepare"), kind: z.enum(["hero", "og"]) });
const FinalizeSchema = z.object({
  intent: z.literal("finalize"),
  kind: z.enum(["hero", "og"]),
  path: z.string().max(160),
});
const RemoveSchema = z.object({ intent: z.literal("remove"), kind: z.enum(["hero", "og"]) });
const DiscardSchema = z.object({
  intent: z.literal("discard"),
  kind: z.enum(["hero", "og"]),
  path: z.string().max(160),
});
const FocusSchema = z.object({
  intent: z.literal("update_focus"),
  x: z.number().int().min(0).max(100),
  y: z.number().int().min(0).max(100),
});
const MediaActionSchema = z.discriminatedUnion("intent", [PrepareSchema, FinalizeSchema, RemoveSchema, DiscardSchema, FocusSchema]);

type SupabaseAdminClient = ReturnType<typeof createServerAdminClient>;

async function loadConfig(supabase: SupabaseAdminClient) {
  return supabase
    .from("app_config")
    .select("id,celebration_hero_url,celebration_og_url")
    .limit(1)
    .maybeSingle();
}

async function cleanupControlledObject(supabase: SupabaseAdminClient, url: string | null | undefined) {
  const path = controlledMediaPathFromUrl(url, process.env.SUPABASE_URL);
  if (!path) return;
  const { error } = await supabase.storage.from(CELEBRATION_MEDIA_BUCKET).remove([path]);
  if (error) console.warn("Cleanup pendente de mídia da celebração.", { path, message: error.message });
}

async function discardCandidate(supabase: SupabaseAdminClient, path: string) {
  const { error } = await supabase.storage.from(CELEBRATION_MEDIA_BUCKET).remove([path]);
  if (error) console.warn("Não foi possível remover uma mídia candidata inválida.", { path, message: error.message });
}

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: noStoreHeaders() });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserSession(request);
  assertSameOrigin(request);
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (!(await consumeRateLimit(request, "admin-celebration-media", 40, 60))) {
    return json({ error: "Muitas operações de mídia. Aguarde um instante." }, 429);
  }

  const parsed = MediaActionSchema.safeParse(await readJsonBody(request, 4_096));
  if (!parsed.success) return json({ error: "Revise os dados da imagem." }, 400);
  const payload = parsed.data;
  const supabase = createServerAdminClient();

  if (payload.intent === "prepare") {
    const path = createCelebrationMediaPath(payload.kind);
    const { data, error } = await supabase.storage
      .from(CELEBRATION_MEDIA_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });
    if (error || !data) return json({ error: "Não foi possível preparar o envio da imagem." }, 503);
    return json({
      bucket: CELEBRATION_MEDIA_BUCKET,
      path,
      token: data.token,
      contentType: mediaRule(payload.kind).contentType,
      cacheControl: CELEBRATION_MEDIA_CACHE_SECONDS,
    });
  }

  if (payload.intent === "update_focus") {
    const { error } = await supabase.from("app_config").update({
      celebration_hero_focal_x: payload.x,
      celebration_hero_focal_y: payload.y,
    }).not("id", "is", null);
    return error ? json({ error: "Não foi possível salvar o enquadramento." }, 500) : json({ success: true, x: payload.x, y: payload.y });
  }

  if (payload.intent === "discard") {
    if (!isExpectedCelebrationMediaPath(payload.kind, payload.path)) return json({ error: "Caminho de mídia inválido." }, 400);
    await discardCandidate(supabase, payload.path);
    return json({ success: true });
  }

  if (payload.intent === "remove") {
    const config = await loadConfig(supabase);
    if (config.error || !config.data) return json({ error: "Configuração da celebração indisponível." }, 503);
    const column = payload.kind === "hero" ? "celebration_hero_url" : "celebration_og_url";
    const previousUrl = config.data[column] as string | null;
    const { error } = await supabase.from("app_config").update({ [column]: null }).eq("id", config.data.id);
    if (error) return json({ error: "Não foi possível remover a imagem publicada." }, 500);
    await cleanupControlledObject(supabase, previousUrl);
    return json({ success: true, url: null });
  }

  if (!isExpectedCelebrationMediaPath(payload.kind, payload.path)) {
    return json({ error: "Caminho de mídia inválido." }, 400);
  }

  const download = await supabase.storage.from(CELEBRATION_MEDIA_BUCKET).download(payload.path);
  if (download.error || !download.data) return json({ error: "A imagem enviada não pôde ser confirmada." }, 422);
  const bytes = new Uint8Array(await download.data.arrayBuffer());
  const validation = validateFinalCelebrationMedia(payload.kind, bytes);
  if (!validation.valid) {
    await discardCandidate(supabase, payload.path);
    return json({ error: validation.error }, 422);
  }

  const config = await loadConfig(supabase);
  if (config.error || !config.data) {
    await discardCandidate(supabase, payload.path);
    return json({ error: "Configuração da celebração indisponível." }, 503);
  }
  const column = payload.kind === "hero" ? "celebration_hero_url" : "celebration_og_url";
  const previousUrl = config.data[column] as string | null;
  const { data: publicData } = supabase.storage.from(CELEBRATION_MEDIA_BUCKET).getPublicUrl(payload.path);
  const nextUrl = publicData.publicUrl;
  const { error: updateError } = await supabase.from("app_config").update({ [column]: nextUrl }).eq("id", config.data.id);
  if (updateError) {
    await discardCandidate(supabase, payload.path);
    return json({ error: "Não conseguimos publicar a imagem. A anterior continua ativa." }, 500);
  }

  if (previousUrl !== nextUrl) await cleanupControlledObject(supabase, previousUrl);
  return json({ success: true, url: nextUrl, width: validation.image.width, height: validation.image.height });
}
