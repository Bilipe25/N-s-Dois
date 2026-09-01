import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const celebrationCss = readFileSync(new URL("./celebration.css", import.meta.url), "utf8");

function cssRule(selector: string) {
  const start = celebrationCss.indexOf(`${selector} {`);
  const end = celebrationCss.indexOf("}", start);
  return start >= 0 && end > start ? celebrationCss.slice(start, end + 1) : "";
}

describe("Celebration Hero", () => {
  it("mantém a foto SSR visível mesmo quando o load ocorre antes da hidratação", () => {
    const heroPhotoRule = cssRule(".celebration-hero-photo");

    expect(heroPhotoRule).toContain("opacity: 1");
    expect(heroPhotoRule).not.toContain("opacity: 0");
  });
});
