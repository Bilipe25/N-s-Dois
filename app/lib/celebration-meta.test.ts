import { describe, expect, it } from "vitest";
import { celebrationSocialImageMeta, resolveCelebrationSocialImage } from "./celebration-meta";

const canonical = "https://nosdois.example/celebracao";

describe("metadata social da celebração", () => {
  it("usa o fallback PNG absoluto quando não há OG personalizada", () => {
    expect(resolveCelebrationSocialImage(null, canonical)).toEqual({
      url: "https://nosdois.example/celebration-og.png",
      contentType: "image/png",
    });
  });

  it("usa a OG configurada tanto no Open Graph quanto no Twitter", () => {
    const ogUrl = "https://project.supabase.co/storage/v1/object/public/celebration-media/og/image.jpg";
    const meta = celebrationSocialImageMeta(ogUrl, canonical);
    expect(meta).toContainEqual({ property: "og:image", content: ogUrl });
    expect(meta).toContainEqual({ property: "og:image:type", content: "image/jpeg" });
    expect(meta).toContainEqual({ name: "twitter:image", content: ogUrl });
  });

  it("não produz metadata inválida quando a URL cadastrada é inválida", () => {
    expect(resolveCelebrationSocialImage("not a url", canonical).url).toBe("https://nosdois.example/celebration-og.png");
    expect(resolveCelebrationSocialImage(null, "/celebracao").url).toBe("/celebration-og.png");
  });
});
