import { describe, expect, it } from "vitest";
import { formatCelebrationDate, getCelebrationPhase } from "./celebration-time";

const event = (starts_at: string | null) => ({ starts_at });

describe("tempo da celebração", () => {
  it("formata sempre em America/Fortaleza", () => {
    expect(formatCelebrationDate("2026-10-18T18:00:00Z")).toContain("15:00");
  });

  it("distingue sem data, pré, durante e pós-evento", () => {
    const start = Date.parse("2026-10-18T18:00:00Z");
    expect(getCelebrationPhase([event(null)], start)).toBe("undated");
    expect(getCelebrationPhase([event("2026-10-18T18:00:00Z")], start - 1)).toBe("upcoming");
    expect(getCelebrationPhase([event("2026-10-18T18:00:00Z")], start + 60_000)).toBe("live");
    expect(getCelebrationPhase([event("2026-10-18T18:00:00Z")], start + 13 * 60 * 60 * 1000)).toBe("past");
  });
});
