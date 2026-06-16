import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gift, Heart, ShoppingBag } from "lucide-react";
import type { Gift as GiftType } from "./types";

interface GiftCardProps {
    gift: GiftType;
    onSelect: (gift: GiftType) => void;
}

export function GiftCard({ gift, onSelect }: GiftCardProps) {
    const isReserved = gift.status === 'comprado';

    return (
        <Card className={`overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] border-stone-200 ${isReserved ? 'opacity-75 grayscale-[0.5]' : 'bg-white'}`}>
            {gift.image_url && (
                <div className="h-48 w-full overflow-hidden bg-stone-100 relative">
                    <img
                        src={gift.image_url}
                        alt={gift.item_name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {isReserved && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-white/90 text-stone-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                Reservado
                            </span>
                        </div>
                    )}
                </div>
            )}

            <CardContent className={`p-4 ${!gift.image_url ? 'pt-6' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-serif text-lg font-medium text-stone-800 leading-tight mb-1">
                            {gift.item_name}
                        </h3>
                        {gift.category && (
                            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">
                                {gift.category}
                            </span>
                        )}
                    </div>
                    {!isReserved && <Heart className="h-4 w-4 text-rose-300 shrink-0" />}
                </div>

                <div className="flex flex-wrap gap-2 mt-3 mb-4">
                    {gift.suggested_store && (
                        <Badge variant="secondary" className="text-xs font-normal bg-stone-100 text-stone-600 hover:bg-stone-200">
                            <ShoppingBag className="h-3 w-3 mr-1" /> {gift.suggested_store}
                        </Badge>
                    )}
                    {gift.price_range && (
                        <Badge variant="outline" className="text-xs font-normal border-stone-200 text-stone-600">
                            {gift.price_range}
                        </Badge>
                    )}
                </div>

                {gift.link && (
                    <a
                        href={gift.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 mb-3 transition-colors"
                    >
                        <ExternalLink className="h-3 w-3" /> Ver sugestão na loja
                    </a>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button
                    className={`w-full ${isReserved ? 'bg-stone-100 text-stone-400 hover:bg-stone-100 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow'}`}
                    onClick={() => !isReserved && onSelect(gift)}
                    disabled={isReserved}
                    variant={isReserved ? "ghost" : "default"}
                >
                    {isReserved ? (
                        <span className="flex items-center gap-2">
                            Reservado por {gift.reserved_by?.split(' ')[0]}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Gift className="h-4 w-4" /> Vou Presentear
                        </span>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
