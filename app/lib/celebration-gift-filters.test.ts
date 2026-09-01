import { describe, expect, it } from "vitest";
import {
  formatCelebrationGiftResultCount,
  getCelebrationGiftFilterCount,
  getCelebrationGiftPriceLabel,
  shouldShowCelebrationGiftCompactFilters,
} from "./celebration-gift-filters";

describe("filtros de presentes da celebração", () => {
  it("conta somente categoria e preço", () => {
    expect(getCelebrationGiftFilterCount(null, "")).toBe(0);
    expect(getCelebrationGiftFilterCount("Cozinha", "")).toBe(1);
    expect(getCelebrationGiftFilterCount("Cozinha", "0-100")).toBe(2);
  });

  it("mantém os rótulos das faixas existentes", () => {
    expect(getCelebrationGiftPriceLabel("100-300")).toBe("R$ 100 a R$ 300");
    expect(getCelebrationGiftPriceLabel("inexistente")).toBeNull();
  });

  it("formata a quantidade com singular e plural", () => {
    expect(formatCelebrationGiftResultCount(0)).toBe("0 presentes");
    expect(formatCelebrationGiftResultCount(1)).toBe("1 presente");
    expect(formatCelebrationGiftResultCount(94)).toBe("94 presentes");
  });

  it("exibe a barra somente entre o filtro completo e o final da seção mobile", () => {
    expect(shouldShowCelebrationGiftCompactFilters({ isMobile: true, fullFiltersBottom: 120, sectionEndTop: 900 })).toBe(false);
    expect(shouldShowCelebrationGiftCompactFilters({ isMobile: true, fullFiltersBottom: -1, sectionEndTop: 900 })).toBe(true);
    expect(shouldShowCelebrationGiftCompactFilters({ isMobile: true, fullFiltersBottom: -120, sectionEndTop: 64 })).toBe(false);
    expect(shouldShowCelebrationGiftCompactFilters({ isMobile: false, fullFiltersBottom: -120, sectionEndTop: 900 })).toBe(false);
  });
});
