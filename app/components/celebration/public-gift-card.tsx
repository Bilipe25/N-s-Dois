import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicGift } from "@/schemas/celebration";
import { ExternalLink, Gift, QrCode, ShoppingBag } from "lucide-react";

type PublicGiftCardProps = {
  gift: PublicGift;
  canReserve: boolean;
  busy?: boolean;
  onReserve: (gift: PublicGift) => void;
  onPix?: (gift: PublicGift) => void;
};

export function PublicGiftCard({ gift, canReserve, busy = false, onReserve, onPix }: PublicGiftCardProps) {
  const reservedBySomeoneElse = !gift.available && !gift.reservation_id;

  return (
    <Card className={`h-full overflow-hidden border-stone-200 bg-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md ${reservedBySomeoneElse ? "opacity-65" : ""}`}>
      <div className="flex h-full min-h-36 items-stretch">
        <div className="relative flex w-28 shrink-0 items-center justify-center overflow-hidden border-r border-stone-100 bg-stone-50 sm:w-32">
          {gift.image_url ? (
            <img src={gift.image_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
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
            {gift.link && <a href={gift.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-rose-600 underline-offset-4 hover:underline"><ExternalLink className="h-3 w-3" />Ver sugestão online</a>}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 pt-2">
            <Button
              size="sm"
              type="button"
              disabled={busy || reservedBySomeoneElse}
              onClick={() => onReserve(gift)}
              className={`min-h-11 rounded-full px-2 text-xs font-semibold ${gift.reservation_id ? "border border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200" : "border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
              variant="secondary"
            >
              {busy ? "Aguarde…" : gift.reservation_id ? "Cancelar" : reservedBySomeoneElse ? "Reservado" : canReserve ? "Presentear" : "Como reservar"}
            </Button>
            {onPix && !reservedBySomeoneElse && (
              <Button size="sm" type="button" onClick={() => onPix(gift)} className="min-h-11 rounded-full border border-emerald-100 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100" variant="secondary">
                <QrCode className="mr-1 h-3.5 w-3.5" />PIX
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
