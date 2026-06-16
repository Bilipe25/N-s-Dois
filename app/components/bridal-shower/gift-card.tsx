import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gift, ShoppingBag } from "lucide-react";
import type { Gift as GiftType } from "./types";

interface GiftCardProps {
    gift: GiftType;
    onSelect: (gift: GiftType) => void;
    showLinks?: boolean;
    showPrices?: boolean;
}

export function GiftCard({ gift, onSelect, showLinks = true, showPrices = true }: GiftCardProps) {
    const isReserved = gift.status === 'comprado';

    return (
        <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-stone-200 bg-white flex flex-row items-stretch h-full ${isReserved ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            
            {/* Imagem ou Placeholder (Lado Esquerdo) */}
            <div className="w-28 shrink-0 sm:w-32 bg-stone-50 relative border-r border-stone-100 flex items-center justify-center overflow-hidden">
                {gift.image_url ? (
                    <img
                        src={gift.image_url}
                        alt={gift.item_name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-50 to-stone-50 flex items-center justify-center">
                        <Gift className="h-8 w-8 text-rose-200/70" strokeWidth={1.5} />
                    </div>
                )}
                {isReserved && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="bg-white text-stone-900 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Reservado
                        </span>
                    </div>
                )}
            </div>

            {/* Conteúdo e Ações (Lado Direito) */}
            <CardContent className="p-3 sm:p-4 flex flex-col justify-between flex-1 min-w-0">
                
                {/* Info do Presente */}
                <div>
                    {gift.category && (
                        <p className="text-[9px] sm:text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-0.5">
                            {gift.category}
                        </p>
                    )}
                    <h3 className="font-serif text-base sm:text-lg font-medium text-stone-800 leading-tight mb-2 line-clamp-2">
                        {gift.item_name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {gift.suggested_store && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs font-normal bg-stone-100 text-stone-600 px-1.5 py-0">
                                <ShoppingBag className="h-2.5 w-2.5 mr-1" /> {gift.suggested_store}
                            </Badge>
                        )}
                        {showPrices && gift.price_range && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs font-normal border-stone-200 text-stone-600 px-1.5 py-0">
                                {gift.price_range}
                            </Badge>
                        )}
                    </div>

                    {showLinks && gift.link && (
                        <a
                            href={gift.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] sm:text-xs text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 mb-2 transition-colors inline-flex"
                        >
                            <ExternalLink className="h-3 w-3" /> Ver sugestão online
                        </a>
                    )}
                </div>

                {/* Botão de Ação */}
                <div className="mt-auto pt-2">
                    <Button
                        size="sm"
                        className={`w-full sm:w-auto h-8 text-xs font-medium rounded-full ${isReserved ? 'bg-stone-100 text-stone-400 hover:bg-stone-100 cursor-not-allowed shadow-none' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 shadow-sm'}`}
                        onClick={() => !isReserved && onSelect(gift)}
                        disabled={isReserved}
                        variant={isReserved ? "ghost" : "secondary"}
                    >
                        {isReserved ? (
                            <span className="truncate">Reservado</span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <Gift className="h-3.5 w-3.5" /> Presentear
                            </span>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
