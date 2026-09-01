import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicGift } from "@/schemas/celebration";
import { ExternalLink, Gift, QrCode, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

type PublicGiftCardProps = {
  gift: PublicGift;
  busy?: boolean;
  showOnlineSuggestion?: boolean;
  onReserve: (gift: PublicGift) => void;
  onPix?: (gift: PublicGift) => void;
};

export function PublicGiftCard({ gift, busy = false, showOnlineSuggestion = true, onReserve, onPix }: PublicGiftCardProps) {
  const reservedBySomeoneElse = !gift.available && !gift.reservation_id;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [gift.image_url]);

  return (
    <Card className={`h-full overflow-hidden border-stone-200 bg-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md ${reservedBySomeoneElse ? "opacity-65" : ""}`}>
      <div className="flex h-full min-h-36 items-stretch">
        <div className="relative flex w-28 shrink-0 items-center justify-center overflow-hidden border-r border-stone-100 bg-stone-50 sm:w-32">
          {gift.image_url && !imageFailed ? (
            <img src={gift.image_url} alt="" width={320} height={320} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" onError={() => setImageFailed(true)} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-50 to-stone-50">
              <Gift className="h-8 w-8 text-rose-200" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
          {reservedBySomeoneElse && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-800 shadow-sm">Reservado</span>
            </div>
          )}
        </div>

        <CardContent className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:p-4">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">{gift.category || "Presente"}</p>
            <h3 className="mb-2 line-clamp-2 font-serif text-base font-medium leading-tight text-stone-800 sm:text-lg">{gift.item_name}</h3>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {gift.suggested_store && <Badge variant="secondary" className="bg-stone-100 px-1.5 py-0 text-[10px] font-normal text-stone-700"><ShoppingBag className="mr-1 h-3 w-3" />{gift.suggested_store}</Badge>}
              {gift.price_range && <Badge variant="outline" className="border-stone-200 px-1.5 py-0 text-[10px] font-normal text-stone-700">{gift.price_range}</Badge>}
            </div>
            {showOnlineSuggestion && gift.link && <a href={gift.link} target="_blank" rel="noopener noreferrer" aria-label={`Ver sugestão online para ${gift.item_name}`} className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-rose-700 underline-offset-4 hover:underline"><ExternalLink className="h-3.5 w-3.5" />Ver sugestão online</a>}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 pt-2 min-[360px]:grid-cols-2">
            <Button
              size="sm"
              type="button"
              disabled={busy || reservedBySomeoneElse}
              onClick={() => onReserve(gift)}
              aria-label={gift.reservation_id ? `Ver ou cancelar minha escolha de ${gift.item_name}` : reservedBySomeoneElse ? `${gift.item_name} já foi escolhido` : `Escolher ${gift.item_name} para comprar ou entregar`}
              className={`min-h-11 rounded-full px-2 text-xs font-semibold ${gift.reservation_id ? "border border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200" : "bg-rose-500 text-white hover:bg-rose-600"}`}
              variant="secondary"
            >
              {busy ? "Aguarde…" : gift.reservation_id ? "Minha escolha" : reservedBySomeoneElse ? "Já escolhido" : "Escolher presente"}
            </Button>
            {onPix && !reservedBySomeoneElse && (
              <Button size="sm" type="button" onClick={() => onPix(gift)} aria-label={`Presentear ${gift.item_name} por PIX`} className="min-h-11 rounded-full border border-emerald-200 bg-white px-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50" variant="outline">
                <QrCode className="mr-1 h-3.5 w-3.5" />PIX
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
