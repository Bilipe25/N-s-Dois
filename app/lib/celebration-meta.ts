export function resolveCelebrationSocialImage(ogUrl: string | null | undefined, canonical: string) {
  let fallback = "/celebration-og.png";
  try {
    fallback = new URL("/celebration-og.png", canonical).href;
  } catch {
    // Meta can render once without loader data while an error boundary is being prepared.
  }
  if (!ogUrl) return { url: fallback, contentType: "image/png" as const };
  try {
    const parsed = new URL(ogUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return { url: fallback, contentType: "image/png" as const };
    const url = parsed.href;
    const pathname = parsed.pathname.toLowerCase();
    const contentType = pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")
      ? "image/jpeg"
      : pathname.endsWith(".webp")
        ? "image/webp"
        : "image/png";
    return { url, contentType };
  } catch {
    return { url: fallback, contentType: "image/png" as const };
  }
}

export function celebrationSocialImageMeta(ogUrl: string | null | undefined, canonical: string) {
  const image = resolveCelebrationSocialImage(ogUrl, canonical);
  return [
    { property: "og:image", content: image.url },
    { property: "og:image:type", content: image.contentType },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "Gabriel e Raabe — Celebrando o Amor e o Novo Lar" },
    { name: "twitter:image", content: image.url },
  ];
}
