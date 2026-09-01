import { randomUUID } from "node:crypto";

export const CELEBRATION_MEDIA_BUCKET = "celebration-media";
export const CELEBRATION_MEDIA_CACHE_SECONDS = "31536000";

export type CelebrationMediaKind = "hero" | "og";

const MEDIA_RULES = {
  hero: {
    extension: "webp",
    contentType: "image/webp",
    maxBytes: 5 * 1024 * 1024,
  },
  og: {
    extension: "jpg",
    contentType: "image/jpeg",
    maxBytes: 3 * 1024 * 1024,
  },
} as const;

export function mediaRule(kind: CelebrationMediaKind) {
  return MEDIA_RULES[kind];
}

export function createCelebrationMediaPath(kind: CelebrationMediaKind, id = randomUUID()) {
  const rule = mediaRule(kind);
  return `${kind}/${id}.${rule.extension}`;
}

export function isExpectedCelebrationMediaPath(kind: CelebrationMediaKind, path: string) {
  const extension = mediaRule(kind).extension;
  return new RegExp(`^${kind}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.${extension}$`, "i").test(path);
}

type ImageInspection = {
  contentType: "image/jpeg" | "image/webp";
  width: number;
  height: number;
};

function inspectJpeg(bytes: Uint8Array): ImageInspection | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) continue;
    if (offset + 2 > bytes.length) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    const isStartOfFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isStartOfFrame && length >= 7 && offset + 7 <= bytes.length) {
      return {
        contentType: "image/jpeg",
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    if (length < 2) break;
    offset += length;
  }
  return null;
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function inspectWebp(bytes: Uint8Array): ImageInspection | null {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") return null;
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8X" && bytes.length >= 30) {
    return {
      contentType: "image/webp",
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }
  if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const b1 = bytes[21];
    const b2 = bytes[22];
    const b3 = bytes[23];
    const b4 = bytes[24];
    return {
      contentType: "image/webp",
      width: 1 + b1 + ((b2 & 0x3f) << 8),
      height: 1 + ((b2 & 0xc0) >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
    };
  }
  if (chunk === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      contentType: "image/webp",
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
    };
  }
  return null;
}

export function inspectFinalImage(bytes: Uint8Array): ImageInspection | null {
  return inspectJpeg(bytes) || inspectWebp(bytes);
}

export function validateFinalCelebrationMedia(kind: CelebrationMediaKind, bytes: Uint8Array) {
  const rule = mediaRule(kind);
  if (!bytes.length || bytes.length > rule.maxBytes) {
    return { valid: false as const, error: "O arquivo processado excede o limite permitido." };
  }
  const image = inspectFinalImage(bytes);
  if (!image || image.contentType !== rule.contentType) {
    return { valid: false as const, error: "O conteúdo enviado não corresponde ao formato esperado." };
  }
  if (kind === "hero") {
    if (image.width < 640 || image.height < 360 || image.width > 1920 || image.height > 4000) {
      return { valid: false as const, error: "A foto principal possui dimensões inválidas." };
    }
  } else if (image.width !== 1200 || image.height !== 630) {
    return { valid: false as const, error: "A imagem de compartilhamento deve ter 1200 × 630 px." };
  }
  return { valid: true as const, image };
}

export function controlledMediaPathFromUrl(value: string | null | undefined, supabaseUrl: string | undefined) {
  if (!value || !supabaseUrl) return null;
  try {
    const url = new URL(value);
    const expected = new URL(supabaseUrl);
    if (url.origin !== expected.origin) return null;
    const prefix = `/storage/v1/object/public/${CELEBRATION_MEDIA_BUCKET}/`;
    if (!url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (isExpectedCelebrationMediaPath("hero", path) || isExpectedCelebrationMediaPath("og", path)) return path;
  } catch {
    return null;
  }
  return null;
}
