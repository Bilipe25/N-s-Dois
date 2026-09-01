import { useEffect, useRef, useState, type RefObject } from "react";
import { Check, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  CELEBRATION_GIFT_PRICE_FILTERS,
  formatCelebrationGiftResultCount,
  getCelebrationGiftFilterCount,
  getCelebrationGiftPriceLabel,
  shouldShowCelebrationGiftCompactFilters,
} from "@/lib/celebration-gift-filters";

interface CelebrationGiftFiltersProps {
  categories: readonly string[];
  query: string;
  onQueryChange: (value: string) => void;
  category: string | null;
  onCategoryChange: (value: string | null) => void;
  price: string;
  onPriceChange: (value: string) => void;
  resultCount: number;
  loading: boolean;
  error?: string;
  endSentinelRef: RefObject<HTMLDivElement | null>;
}

function useCompactFilterVisibility(
  fullFiltersRef: RefObject<HTMLDivElement | null>,
  endSentinelRef: RefObject<HTMLDivElement | null>,
) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fullFilters = fullFiltersRef.current;
    const endSentinel = endSentinelRef.current;
    const media = window.matchMedia("(max-width: 639px)");
    if (!fullFilters || !endSentinel || !("IntersectionObserver" in window)) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!media.matches) {
        setVisible(false);
        return;
      }
      const fullFiltersBox = fullFilters.getBoundingClientRect();
      const endSentinelBox = endSentinel.getBoundingClientRect();
      setVisible(shouldShowCelebrationGiftCompactFilters({
        isMobile: true,
        fullFiltersBottom: fullFiltersBox.bottom,
        sectionEndTop: endSentinelBox.top,
      }));
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const filtersObserver = new IntersectionObserver(scheduleUpdate);
    const endObserver = new IntersectionObserver(scheduleUpdate, { rootMargin: "-64px 0px 0px 0px" });
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(scheduleUpdate) : null;

    filtersObserver.observe(fullFilters);
    endObserver.observe(endSentinel);
    if (endSentinel.parentElement) resizeObserver?.observe(endSentinel.parentElement);
    media.addEventListener("change", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      filtersObserver.disconnect();
      endObserver.disconnect();
      resizeObserver?.disconnect();
      media.removeEventListener("change", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.cancelAnimationFrame(frame);
    };
  }, [endSentinelRef, fullFiltersRef]);

  return visible;
}

export function CelebrationGiftFilters({
  categories,
  query,
  onQueryChange,
  category,
  onCategoryChange,
  price,
  onPriceChange,
  resultCount,
  loading,
  error,
  endSentinelRef,
}: CelebrationGiftFiltersProps) {
  const fullFiltersRef = useRef<HTMLDivElement>(null);
  const compactFilterButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseButtonRef = useRef<HTMLButtonElement>(null);
  const drawerHasOpenedRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const compactVisible = useCompactFilterVisibility(fullFiltersRef, endSentinelRef);
  const activeFilterCount = getCelebrationGiftFilterCount(category, price);
  const priceLabel = getCelebrationGiftPriceLabel(price);
  const resultLabel = formatCelebrationGiftResultCount(resultCount);

  useEffect(() => {
    if (!drawerOpen) {
      if (!drawerHasOpenedRef.current) return;
      const frame = window.requestAnimationFrame(() => compactFilterButtonRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }

    drawerHasOpenedRef.current = true;
    const frame = window.requestAnimationFrame(() => drawerCloseButtonRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setDrawerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [drawerOpen]);

  return <>
    <div
      ref={fullFiltersRef}
      className="-mx-4 border-b border-stone-200/70 bg-stone-50 px-4 py-3 sm:sticky sm:top-0 sm:z-30 sm:rounded-2xl sm:border sm:bg-stone-50/95 sm:backdrop-blur-md"
      aria-label="Filtros da lista de presentes"
    >
      <GiftFilter
        categories={categories}
        searchTerm={query}
        onSearchChange={onQueryChange}
        selectedCategory={category}
        onCategorySelect={onCategoryChange}
        selectedPriceRange={price}
        onPriceRangeSelect={onPriceChange}
      />
    </div>

    {compactVisible && <div className="celebration-mobile-filter-bar sm:hidden" role="region" aria-label="Filtros rápidos da lista de presentes">
      <div className="celebration-mobile-filter-main">
        <div className="relative min-w-0 max-w-80 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar presente..."
            aria-label="Buscar presente"
            className="h-11 rounded-full border-stone-300 bg-white/95 pl-9 pr-11 text-base shadow-none"
          />
          {query && <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onQueryChange("")}
            className="absolute right-0 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full text-stone-600"
            aria-label="Limpar busca"
          ><X className="h-4 w-4" /></Button>}
        </div>
        <Button
          ref={compactFilterButtonRef}
          type="button"
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className="relative h-11 shrink-0 rounded-full border-stone-300 bg-white/95 px-3 text-stone-800 shadow-none"
          aria-label={`Abrir filtros${activeFilterCount ? `, ${activeFilterCount} ativos` : ""}`}
        >
          <SlidersHorizontal className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Filtros
          {activeFilterCount > 0 && <span className="ml-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold leading-none text-white" aria-hidden="true">{activeFilterCount}</span>}
        </Button>
      </div>

      {activeFilterCount > 0 && <div className="celebration-mobile-filter-chips" aria-label="Filtros ativos">
        {category && <button type="button" onClick={() => onCategoryChange(null)} className="celebration-mobile-filter-chip" aria-label={`Remover filtro de categoria ${category}`}>
          <span>{category}</span><X aria-hidden="true" />
        </button>}
        {priceLabel && <button type="button" onClick={() => onPriceChange("")} className="celebration-mobile-filter-chip" aria-label={`Remover filtro de preço ${priceLabel}`}>
          <span>{priceLabel}</span><X aria-hidden="true" />
        </button>}
      </div>}
    </div>}

    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerContent className="celebration-filter-drawer sm:hidden">
        <DrawerHeader className="relative border-b border-stone-200 px-5 pb-4 pr-16 text-left">
          <DrawerTitle className="font-serif text-2xl text-stone-800">Filtrar presentes</DrawerTitle>
          <DrawerDescription>Escolha uma categoria e uma faixa de preço.</DrawerDescription>
          <DrawerClose asChild>
            <Button ref={drawerCloseButtonRef} type="button" variant="ghost" size="icon" className="celebration-drawer-close" aria-label="Fechar filtros"><X className="h-5 w-5" /></Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="celebration-filter-drawer-scroll space-y-7 px-5 py-5">
          <fieldset>
            <legend className="mb-3 font-serif text-lg font-semibold text-stone-800">Categoria</legend>
            <div className="flex flex-wrap gap-2">
              {[null, ...categories].map((option) => {
                const selected = category === option;
                const label = option || "Todas";
                return <button
                  key={option || "all"}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onCategoryChange(option)}
                  className={`celebration-filter-option rounded-full ${selected ? "is-selected" : ""}`}
                >{label}</button>;
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-serif text-lg font-semibold text-stone-800">Faixa de preço</legend>
            <div className="grid gap-2">
              {CELEBRATION_GIFT_PRICE_FILTERS.map((option) => {
                const selected = price === option.value;
                return <button
                  key={option.value || "all"}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onPriceChange(option.value)}
                  className={`celebration-filter-price-option ${selected ? "is-selected" : ""}`}
                >
                  <span>{option.label}</span>
                  <span className="celebration-filter-check" aria-hidden="true">{selected && <Check />}</span>
                </button>;
              })}
            </div>
          </fieldset>

          {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
        </div>

        <DrawerFooter className="celebration-filter-drawer-footer border-t border-stone-200 bg-stone-50/95 px-5 pt-3">
          <Button
            type="button"
            variant="ghost"
            disabled={activeFilterCount === 0}
            onClick={() => { onCategoryChange(null); onPriceChange(""); }}
            className="min-h-11 rounded-full text-stone-700"
          >Limpar filtros</Button>
          <DrawerClose asChild>
            <Button type="button" disabled={loading} className="min-h-12 rounded-full bg-rose-500 text-white hover:bg-rose-600">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Atualizando…</> : `Mostrar ${resultLabel}`}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </>;
}
