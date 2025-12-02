import { useState } from "react";
import { useNavigation } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Calendar, PartyPopper, QrCode, Search, Share2, Loader2 } from "lucide-react";
import type { Route } from "./+types/public.bridal-shower";
import { GiftCard } from "@/components/bridal-shower/gift-card";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { PixModal } from "@/components/bridal-shower/pix-modal";
import { useGifts, useBridalConfig, useReserveGift } from "@/hooks/useBridalShower";
import type { Gift } from "@/schemas/bridal-shower";

export const meta: Route.MetaFunction = ({ data }) => {
    const title = "Chá de Casa Nova - Gabriel & Raabe";
    const description = "Estamos montando nosso lar! Escolha um presente ou contribua com nosso sonho. ❤️";
    // Using a default image since we don't have direct access to config in meta without loader, 
    // but we could pass it via hydration script if needed. For now, static default + dynamic if available.
    const ogImage = "https://images.unsplash.com/photo-1522673607200-1645062cd4d1?q=80&w=2070&auto=format&fit=crop&v=2";

    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: ogImage },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
    ];
};

export default function PublicBridalShower() {
    const { data: gifts = [], isLoading: isLoadingGifts } = useGifts();
    const { data: config } = useBridalConfig();
    const { mutate: reserveGift, isPending: isReserving } = useReserveGift();

    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);

    // State for success message content
    const [successData, setSuccessData] = useState<{ giftName: string, guestName: string, verse: string } | null>(null);
    const [guestName, setGuestName] = useState("");

    const availableGifts = gifts.filter((g) => g.status !== 'comprado');
    const reservedGifts = gifts.filter((g) => g.status === 'comprado');

    const filteredGifts = availableGifts.filter((g) => {
        const matchesSearch = g.item_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? g.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const handleReserve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGift || !guestName.trim()) return;

        reserveGift({ id: selectedGift.id, name: guestName }, {
            onSuccess: (data) => {
                setSuccessData({
                    giftName: data.giftName,
                    guestName: data.guestName,
                    verse: data.verse
                });
                setShowSuccessModal(true);
                setSelectedGift(null);
                setGuestName("");
            }
        });
    };

    if (isLoadingGifts) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 font-sans pb-20">
            {/* Hero Section */}
            <header className="relative bg-stone-900 border-b border-stone-100 overflow-hidden min-h-[50vh] flex items-center justify-center">
                <img
                    src={config?.bridal_shower_hero_url || "https://images.unsplash.com/photo-1522673607200-1645062cd4d1?q=80&w=2070&auto=format&fit=crop"}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />

                <div className="relative max-w-3xl mx-auto px-6 py-12 text-center space-y-6 z-10">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-[0.2em] uppercase mb-2 shadow-sm">
                        Chá de Casa Nova
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight drop-shadow-lg">
                        Gabriel <span className="text-rose-300 font-light">&</span> Raabe
                    </h1>
                    <p className="text-stone-200 max-w-lg mx-auto leading-relaxed text-lg font-light">
                        Estamos montando nosso lar com muito amor e carinho. Fique à vontade para escolher um presente ou contribuir como preferir! ❤️
                    </p>

                    {(config?.bridal_shower_date || config?.bridal_shower_location) && (
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                            {config.bridal_shower_date && (
                                <div className="flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-full shadow-sm text-sm text-stone-600">
                                    <Calendar className="h-4 w-4 text-rose-400" />
                                    {new Date(config.bridal_shower_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                            )}
                            {config.bridal_shower_location && (
                                <div className="flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-full shadow-sm text-sm text-stone-600">
                                    <MapPin className="h-4 w-4 text-rose-400" />
                                    {config.bridal_shower_location}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            onClick={() => setShowPixModal(true)}
                            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-8 h-12 shadow-lg hover:shadow-rose-500/25 transition-all hover:-translate-y-0.5 w-full sm:w-auto font-medium"
                        >
                            <QrCode className="mr-2 h-4 w-4" /> Presentear com Pix
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: "Chá de Casa Nova - Gabriel & Raabe",
                                        text: "Estamos montando nosso lar! Escolha um presente ou contribua com nosso sonho. ❤️",
                                        url: window.location.href,
                                    });
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert("Link copiado!");
                                }
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full px-6 h-12 w-full sm:w-auto"
                        >
                            <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-8 -mt-6 relative z-10">
                {/* Palette Info */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 text-center space-y-4 mx-auto max-w-2xl">
                    <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Paleta de Cores</h2>
                    <div className="flex justify-center items-center gap-6">
                        <div className="group flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-stone-900 shadow-md ring-2 ring-white transition-transform group-hover:scale-110"></div>
                            <span className="text-[10px] font-medium text-stone-500 uppercase">Preto</span>
                        </div>
                        <div className="group flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-md ring-2 ring-white transition-transform group-hover:scale-110"></div>
                            <span className="text-[10px] font-medium text-stone-500 uppercase">Branco</span>
                        </div>
                        <div className="group flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-stone-400 shadow-md ring-2 ring-white transition-transform group-hover:scale-110"></div>
                            <span className="text-[10px] font-medium text-stone-500 uppercase">Cinza</span>
                        </div>
                        <div className="group flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#d4c4b7] shadow-md ring-2 ring-white transition-transform group-hover:scale-110"></div>
                            <span className="text-[10px] font-medium text-stone-500 uppercase">Bege</span>
                        </div>
                    </div>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                        Para mantermos a harmonia da nossa casinha, pedimos com carinho que os presentes sigam esta paleta.
                    </p>
                </div>

                {/* Filters & List */}
                <section className="space-y-6">
                    <div className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-stone-100/50">
                        <GiftFilter
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            selectedCategory={selectedCategory}
                            onCategorySelect={setSelectedCategory}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredGifts.length === 0 ? (
                            <div className="col-span-full text-center py-16 px-4">
                                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Search className="h-8 w-8 text-stone-300" />
                                </div>
                                <h3 className="text-stone-900 font-medium mb-1">Nenhum presente encontrado</h3>
                                <p className="text-stone-500 text-sm">
                                    {searchTerm ? "Tente buscar por outro termo." : "A lista de presentes está sendo preparada."}
                                </p>
                            </div>
                        ) : (
                            filteredGifts.map((gift) => (
                                <GiftCard
                                    key={gift.id}
                                    gift={gift}
                                    onSelect={setSelectedGift}
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* Reserved Gifts */}
                {reservedGifts.length > 0 && (
                    <section className="pt-12 pb-8 border-t border-stone-200">
                        <h2 className="text-center text-sm font-bold text-stone-400 uppercase tracking-widest mb-8">
                            Já Reservados ({reservedGifts.length})
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60 grayscale-[0.8] hover:grayscale-0 transition-all duration-500">
                            {reservedGifts.map((gift) => (
                                <GiftCard
                                    key={gift.id}
                                    gift={gift}
                                    onSelect={() => { }}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Modals */}
            <Dialog open={!!selectedGift} onOpenChange={(open) => !open && setSelectedGift(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Presente</DialogTitle>
                        <DialogDescription>
                            Que legal! Você escolheu presentear com: <strong>{selectedGift?.item_name}</strong>.
                            Por favor, informe seu nome para marcarmos como reservado.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleReserve}>
                        <div className="py-4">
                            <Input
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Seu Nome Completo"
                                required
                                autoFocus
                                className="h-12 text-lg"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setSelectedGift(null)}>Cancelar</Button>
                            <Button type="submit" disabled={isReserving} className="bg-rose-500 hover:bg-rose-600">
                                {isReserving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...
                                    </>
                                ) : (
                                    "Confirmar Reserva"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md text-center">
                    <div className="flex justify-center my-4">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                            <PartyPopper className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-serif text-stone-800">Obrigado, {successData?.guestName}! ❤️</DialogTitle>
                        <DialogDescription className="text-center text-base pt-2 text-stone-600">
                            Sua reserva do presente <strong>{successData?.giftName}</strong> foi confirmada com sucesso.
                            <br /><br />
                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 italic text-stone-500 text-sm">
                                "{successData?.verse}"
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center mt-4">
                        <Button onClick={() => setShowSuccessModal(false)} className="w-full sm:w-auto bg-stone-900 text-white">
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PixModal
                open={showPixModal}
                onOpenChange={setShowPixModal}
                pixKey={config?.pix_key}
            />
        </div>
    );
}
