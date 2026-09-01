export const CELEBRATION_GIFT_PRICE_FILTERS = [
  { value: "", label: "Todos os preços" },
  { value: "0-100", label: "Até R$ 100" },
  { value: "100-300", label: "R$ 100 a R$ 300" },
  { value: "300-999999", label: "Acima de R$ 300" },
] as const;

export function getCelebrationGiftFilterCount(
  category: string | null,
  priceRange: string,
) {
  return Number(Boolean(category)) + Number(Boolean(priceRange));
}

export function getCelebrationGiftPriceLabel(priceRange: string) {
  return CELEBRATION_GIFT_PRICE_FILTERS.find(
    (option) => option.value === priceRange,
  )?.label ?? null;
}

export function formatCelebrationGiftResultCount(resultCount: number) {
  return `${resultCount} ${resultCount === 1 ? "presente" : "presentes"}`;
}

export function shouldShowCelebrationGiftCompactFilters({
  isMobile,
  fullFiltersBottom,
  sectionEndTop,
}: {
  isMobile: boolean;
  fullFiltersBottom: number;
  sectionEndTop: number;
}) {
  return isMobile && fullFiltersBottom <= 0 && sectionEndTop > 64;
}
