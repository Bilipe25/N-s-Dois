import { describe, expect, it } from "vitest";
import {
  CELEBRATION_MEDIA_BUCKET,
  controlledMediaPathFromUrl,
  createCelebrationMediaPath,
  isExpectedCelebrationMediaPath,
  validateFinalCelebrationMedia,
} from "./celebration-media.server";

function jpeg(width: number, height: number) {
  return Uint8Array.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
    0xff, 0xd9,
  ]);
}

function webp(width: number, height: number) {
  const bytes = new Uint8Array(30);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  bytes.set(new TextEncoder().encode("WEBP"), 8);
  bytes.set(new TextEncoder().encode("VP8X"), 12);
  const encodedWidth = width - 1;
  const encodedHeight = height - 1;
  bytes.set([encodedWidth & 0xff, (encodedWidth >> 8) & 0xff, (encodedWidth >> 16) & 0xff], 24);
  bytes.set([encodedHeight & 0xff, (encodedHeight >> 8) & 0xff, (encodedHeight >> 16) & 0xff], 27);
  return bytes;
}

describe("mídia da celebração no servidor", () => {
  it("gera paths versionados, restritos ao propósito e sem nome original", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(createCelebrationMediaPath("hero", id)).toBe(`hero/${id}.webp`);
    expect(createCelebrationMediaPath("og", id)).toBe(`og/${id}.jpg`);
    expect(isExpectedCelebrationMediaPath("hero", `hero/${id}.webp`)).toBe(true);
    expect(isExpectedCelebrationMediaPath("hero", "../../hero.webp")).toBe(false);
  });

  it("aceita Hero WebP dentro dos limites e rejeita tipo ou dimensões indevidas", () => {
    expect(validateFinalCelebrationMedia("hero", webp(1600, 900)).valid).toBe(true);
    expect(validateFinalCelebrationMedia("hero", jpeg(1600, 900)).valid).toBe(false);
    expect(validateFinalCelebrationMedia("hero", webp(320, 180)).valid).toBe(false);
  });

  it("exige OG JPEG exatamente em 1200 × 630", () => {
    expect(validateFinalCelebrationMedia("og", jpeg(1200, 630)).valid).toBe(true);
    expect(validateFinalCelebrationMedia("og", jpeg(1200, 628)).valid).toBe(false);
    expect(validateFinalCelebrationMedia("og", webp(1200, 630)).valid).toBe(false);
  });

  it("rejeita arquivo final acima do limite mesmo com assinatura válida", () => {
    const oversized = new Uint8Array(5 * 1024 * 1024 + 1);
    oversized.set(webp(1600, 900));
    expect(validateFinalCelebrationMedia("hero", oversized).valid).toBe(false);
  });

  it("só reconhece para cleanup URLs controladas do projeto", () => {
    const project = "https://project.supabase.co";
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const controlled = `${project}/storage/v1/object/public/${CELEBRATION_MEDIA_BUCKET}/hero/${id}.webp`;
    expect(controlledMediaPathFromUrl(controlled, project)).toBe(`hero/${id}.webp`);
    expect(controlledMediaPathFromUrl("https://images.example.com/legacy.jpg", project)).toBeNull();
    expect(controlledMediaPathFromUrl(`${project}/storage/v1/object/public/other/hero/${id}.webp`, project)).toBeNull();
  });
});
