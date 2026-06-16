import { GiftCard } from "./gift-card";
import type { Gift } from "@/schemas/bridal-shower";

interface ReservedGiftsSectionProps {
    gifts: Gift[];
}

export function ReservedGiftsSection({ gifts }: ReservedGiftsSectionProps) {
    if (gifts.length === 0) return null;

    return (
        <section className="pt-8 pb-12">
            <h2 className="text-center text-xs font-bold text-stone-400 uppercase tracking-widest mb-8">
                Já Reservados ({gifts.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {gifts.map((gift) => (
                    <GiftCard
                        key={gift.id}
                        gift={gift}
                        onSelect={() => { }}
                    />
                ))}
            </div>
        </section>
    );
}
