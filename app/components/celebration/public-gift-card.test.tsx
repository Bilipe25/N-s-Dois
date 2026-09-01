import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PublicGift } from "@/schemas/celebration";
import { PublicGiftCard } from "./public-gift-card";

const gift: PublicGift = {
  id: "11111111-1111-4111-8111-111111111111",
  item_name: "Jogo de panelas",
  category: "Cozinha",
  suggested_store: "Loja exemplo",
  link: "https://example.com/presente",
  price_range: "R$ 100–300",
  price_cents: null,
  image_url: null,
  available: true,
  reservation_id: null,
};

describe("PublicGiftCard", () => {
  it("exibe a sugestão online quando a configuração está ativa", () => {
    const html = renderToStaticMarkup(<PublicGiftCard gift={gift} onReserve={vi.fn()} showOnlineSuggestion />);

    expect(html).toContain("Ver sugestão online");
    expect(html).toContain(gift.link);
  });

  it("remove o link e seu espaço quando a configuração está inativa", () => {
    const html = renderToStaticMarkup(<PublicGiftCard gift={gift} onReserve={vi.fn()} showOnlineSuggestion={false} />);

    expect(html).not.toContain("Ver sugestão online");
    expect(html).not.toContain(gift.link);
    expect(html).toContain(gift.suggested_store);
    expect(html).toContain(gift.price_range);
  });
});
