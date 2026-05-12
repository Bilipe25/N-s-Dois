import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Calendar, PartyPopper, QrCode, Search, Share2, Loader2, Heart, MessageCircle, Navigation, ChevronUp } from "lucide-react";
import type { Route } from "./+types/public.bridal-shower";
import { GiftCard } from "@/components/bridal-shower/gift-card";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { PixModal } from "@/components/bridal-shower/pix-modal";
import { useBridalData, useReserveGift, useConfirmPresence } from "@/hooks/useBridalShower";
import type { Gift } from "@/schemas/bridal-shower";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import { createClient } from "@/lib/supabase";
import type { LoaderFunctionArgs } from "react-router";

const BRIDAL_HERO_FALLBACK = "https://images.unsplash.com/photo-1522673607200-1645062cd4d1?q=80&w=2070&auto=format&fit=crop";

// Loader para buscar config (necessário para meta tags OG)
export const loader = async ({ request }: LoaderFunctionArgs) => {
    const supabase = createClient(request);
    const { data: config } = await supabase
        .from("app_config")
        .select("bridal_shower_hero_url")
        .single();

    return {
        heroUrl: config?.bridal_shower_hero_url,
        publicSiteUrl: process.env.PUBLIC_SITE_URL || new URL(request.url).origin
    };
};

export const meta: Route.MetaFunction = ({ data }) => {
    const title = "Chá de Casa Nova | Gabriel & Raabe 💍";
    const description = "Estamos montando nosso lar com muito amor! Venha celebrar conosco e, se desejar, escolha um presente para nos ajudar nessa nova jornada. ❤️";
    // Usa imagem do config ou fallback para imagem elegante
    const defaultImage = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&h=630&auto=format&fit=crop";
    const ogImage = (data as any)?.heroUrl || defaultImage;
    const publicSiteUrl = ((data as any)?.publicSiteUrl || "https://nosdois.vercel.app").replace(/\/$/, "");
    const siteUrl = `${publicSiteUrl}/public/bridal-shower`;

    return [
        { title },
        { name: "description", content: description },
        { name: "theme-color", content: "#f43f5e" },
        // Open Graph
        { property: "og:type", content: "website" },
        { property: "og:url", content: siteUrl },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Chá de Casa Nova - Gabriel & Raabe" },
        { property: "og:site_name", content: "Nós Dois" },
        { property: "og:locale", content: "pt_BR" },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:url", content: siteUrl },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        // WhatsApp specific
        { property: "og:image:type", content: "image/jpeg" },
    ];
};

export default function PublicBridalShower() {
    const { data: bridalData, isLoading } = useBridalData();
    const gifts = bridalData?.gifts || [];
    const guests = bridalData?.guests || [];
    const config = bridalData?.config;

    const { mutate: reserveGift, isPending: isReserving } = useReserveGift();
    const { mutate: confirmPresence, isPending: isConfirming } = useConfirmPresence();

    // Gift Reservation State
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<{ giftName: string, guestName: string, verse: string } | null>(null);

    // Confirmation State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConfirmSuccessModal, setShowConfirmSuccessModal] = useState(false);
    const [confirmSuccessData, setConfirmSuccessData] = useState<{ guestName: string, locationName: string } | null>(null);
    const [reserveGuestName, setReserveGuestName] = useState("");
    const [confirmGuestName, setConfirmGuestName] = useState("");
    const [selectedLocation, setSelectedLocation] = useState<"local1" | "local2" | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Pix State
    const [showPixModal, setShowPixModal] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Detectar scroll para mostrar botão voltar ao topo
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Função para compartilhar
    const handleShare = useCallback(async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({ url });
            } catch (err) {
                // User cancelled or error
            }
        } else {
            // Fallback: copiar link
            await navigator.clipboard.writeText(url);
            alert('Link copiado!');
        }
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const availableGifts = gifts.filter((g) => g.status !== 'comprado');
    const reservedGifts = gifts.filter((g) => g.status === 'comprado');

    const filteredGifts = availableGifts.filter((g) => {
        const matchesSearch = g.item_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? g.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    // Auto-select location if only one is available
    useEffect(() => {
        if (showConfirmModal && config) {
            if (config.bridal_shower_location && !config.bridal_shower_location_2) {
                setSelectedLocation("local1");
            } else if (!config.bridal_shower_location && config.bridal_shower_location_2) {
                setSelectedLocation("local2");
            }
        }
    }, [showConfirmModal, config]);

    const handleReserve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGift || !reserveGuestName.trim()) return;

        reserveGift({ id: selectedGift.id, name: reserveGuestName }, {
            onSuccess: (data) => {
                setSuccessData({
                    giftName: data.giftName,
                    guestName: data.guestName,
                    verse: data.verse
                });
                setShowSuccessModal(true);
                setSelectedGift(null);
                setReserveGuestName("");
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        });
    };

    const handleConfirmPresence = (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmGuestName.trim() || !selectedLocation) return;

        confirmPresence({ name: confirmGuestName, confirmed_location: selectedLocation }, {
            onSuccess: (data) => {
                setShowConfirmModal(false);
                setConfirmGuestName("");
                setSelectedLocation(null);
                setConfirmSuccessData({
                    guestName: data.guestName || confirmGuestName,
                    locationName: data.locationName || (selectedLocation === 'local1' ? config?.bridal_shower_location : config?.bridal_shower_location_2) || "Local"
                });
                setShowConfirmSuccessModal(true);
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#f43f5e', '#fb7185', '#ffe4e6']
                });
            }
        });
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-50">
                {/* Skeleton Hero */}
                <div className="relative bg-stone-200 min-h-[85vh] flex items-center justify-center animate-pulse">
                    <div className="text-center space-y-6 px-6">
                        <div className="h-6 w-32 bg-stone-300 rounded-full mx-auto" />
                        <div className="h-16 w-72 bg-stone-300 rounded-xl mx-auto" />
                        <div className="h-4 w-64 bg-stone-300 rounded mx-auto" />
                        <div className="h-14 w-48 bg-stone-300 rounded-full mx-auto mt-8" />
                    </div>
                </div>
                {/* Skeleton Content */}
                <div className="max-w-5xl mx-auto p-4 space-y-8 -mt-10">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="bg-white rounded-3xl p-8 h-64 animate-pulse">
                            <div className="h-12 w-12 bg-stone-200 rounded-2xl mx-auto mb-4" />
                            <div className="h-6 w-32 bg-stone-200 rounded mx-auto mb-2" />
                            <div className="h-4 w-48 bg-stone-200 rounded mx-auto" />
                        </div>
                        <div className="bg-white rounded-3xl p-8 h-64 animate-pulse">
                            <div className="h-12 w-12 bg-stone-200 rounded-2xl mx-auto mb-4" />
                            <div className="h-6 w-32 bg-stone-200 rounded mx-auto mb-2" />
                            <div className="h-4 w-48 bg-stone-200 rounded mx-auto" />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse">
                                <div className="h-48 bg-stone-200 rounded-t-2xl" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 w-24 bg-stone-200 rounded" />
                                    <div className="h-6 w-full bg-stone-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const hasTwoLocations = config?.bridal_shower_location && config?.bridal_shower_location_2;

    return (
        <div className="min-h-screen bg-stone-50 font-sans pb-20 selection:bg-rose-100 selection:text-rose-900">
            {/* Floating Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed bottom-safe-6 right-6 z-50"
                    >
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-full shadow-lg bg-white/90 backdrop-blur-md border-stone-200 hover:bg-white hover:scale-105 transition-all"
                            onClick={scrollToTop}
                            title="Voltar ao topo"
                        >
                            <ChevronUp className="h-5 w-5 text-stone-600" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Hero Section */}
            <header className="relative bg-stone-900 border-b border-stone-100 overflow-hidden min-h-[82svh] flex items-center justify-center">
                <motion.img
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 1.5 }}
                    src={config?.bridal_shower_hero_url || BRIDAL_HERO_FALLBACK}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(event) => {
                        if (event.currentTarget.src !== BRIDAL_HERO_FALLBACK) {
                            event.currentTarget.src = BRIDAL_HERO_FALLBACK;
                        } else {
                            event.currentTarget.style.display = "none";
                        }
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />

                <div className="relative max-w-4xl mx-auto px-6 py-12 text-center space-y-8 z-10 flex flex-col items-center">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-[0.2em] uppercase mb-2 shadow-sm"
                    >
                        Chá de Casa Nova
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-[clamp(3rem,15vw,7rem)] font-serif text-white tracking-tight drop-shadow-2xl leading-[0.95]"
                    >
                        Gabriel <span className="text-rose-300 font-light">&</span> Raabe
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-stone-200 max-w-lg mx-auto leading-relaxed text-base sm:text-lg font-light"
                    >
                        Estamos montando nosso lar com muito amor. Sua presença é o nosso maior presente, mas se quiser nos ajudar, ficaremos muito felizes! ❤️
                    </motion.p>

                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col items-center justify-center gap-4 w-full max-w-xl pt-4"
                    >
                        <Button
                            onClick={() => setShowConfirmModal(true)}
                            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-8 h-14 text-base sm:text-lg shadow-lg hover:shadow-rose-500/25 transition-all hover:-translate-y-1 w-full font-medium"
                        >
                            <Heart className="mr-2 h-5 w-5 fill-current" /> Confirmar Presença
                        </Button>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
                            <Button
                                variant="outline"
                                onClick={() => setShowPixModal(true)}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full h-12 transition-all hover:-translate-y-1 text-sm"
                            >
                                <QrCode className="mr-1.5 h-4 w-4" /> Pix
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => scrollToSection("locais")}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full h-12 transition-all hover:-translate-y-1 text-sm"
                            >
                                <MapPin className="mr-1.5 h-4 w-4" /> Locais
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => scrollToSection("paleta-cores")}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full h-12 transition-all hover:-translate-y-1 text-sm"
                            >
                                🎨 Paleta
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => scrollToSection("lista-presentes")}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full h-12 transition-all hover:-translate-y-1 text-sm"
                            >
                                <PartyPopper className="mr-1.5 h-4 w-4" /> Presentes
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleShare}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full h-12 transition-all hover:-translate-y-1 text-sm col-span-2 sm:col-span-1"
                            >
                                <Share2 className="mr-1.5 h-4 w-4" /> Compartilhar
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 space-y-16 -mt-10 relative z-10">
                {/* Locations Section */}
                <section id="locais" className="scroll-mt-24">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Location 1 */}
                        {config?.bridal_shower_location && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-3xl p-8 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col items-center text-center space-y-4 hover:border-rose-100 transition-colors"
                            >
                                <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-2">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-stone-800">{config.bridal_shower_location}</h3>
                                <div className="space-y-1 text-stone-600">
                                    <p className="font-medium flex items-center justify-center gap-2">
                                        <Calendar className="h-4 w-4 text-rose-400" />
                                        {config.bridal_shower_date ? new Date(config.bridal_shower_date).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }) : 'Data a definir'}
                                    </p>
                                    <p className="text-sm opacity-80 max-w-[250px] mx-auto">{config.bridal_shower_address_1}</p>
                                </div>
                                {config.bridal_shower_map_link_1 && (
                                    <Button variant="outline" className="rounded-full mt-4 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" asChild>
                                        <a href={config.bridal_shower_map_link_1} target="_blank" rel="noopener noreferrer">
                                            <Navigation className="mr-2 h-4 w-4" /> Ver no Mapa
                                        </a>
                                    </Button>
                                )}
                            </motion.div>
                        )}

                        {/* Location 2 */}
                        {config?.bridal_shower_location_2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-3xl p-8 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col items-center text-center space-y-4 hover:border-rose-100 transition-colors"
                            >
                                <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-2">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-stone-800">{config.bridal_shower_location_2}</h3>
                                <div className="space-y-1 text-stone-600">
                                    <p className="font-medium flex items-center justify-center gap-2">
                                        <Calendar className="h-4 w-4 text-rose-400" />
                                        {config.bridal_shower_date_2 ? new Date(config.bridal_shower_date_2).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }) : 'Data a definir'}
                                    </p>
                                    <p className="text-sm opacity-80 max-w-[250px] mx-auto">{config.bridal_shower_address_2}</p>
                                </div>
                                {config.bridal_shower_map_link_2 && (
                                    <Button variant="outline" className="rounded-full mt-4 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" asChild>
                                        <a href={config.bridal_shower_map_link_2} target="_blank" rel="noopener noreferrer">
                                            <Navigation className="mr-2 h-4 w-4" /> Ver no Mapa
                                        </a>
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* Palette Info */}
                <section id="paleta-cores" className="scroll-mt-24">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center space-y-6 mx-auto max-w-3xl"
                    >
                        <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Paleta de Cores Sugerida</h2>
                        <div className="flex justify-center items-center gap-8">
                            <div className="group flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-stone-900 shadow-md ring-4 ring-stone-50 transition-transform group-hover:scale-110"></div>
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Preto</span>
                            </div>
                            <div className="group flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white border border-stone-200 shadow-md ring-4 ring-stone-50 transition-transform group-hover:scale-110"></div>
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Branco</span>
                            </div>
                            <div className="group flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-stone-400 shadow-md ring-4 ring-stone-50 transition-transform group-hover:scale-110"></div>
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Cinza</span>
                            </div>
                            <div className="group flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#d4c4b7] shadow-md ring-4 ring-stone-50 transition-transform group-hover:scale-110"></div>
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Bege</span>
                            </div>
                        </div>
                        <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                            Para mantermos a harmonia visual, adoraríamos que os presentes seguissem esta paleta de cores neutras.
                        </p>
                    </motion.div>
                </section>

                {/* Gift List */}
                <section id="lista-presentes" className="space-y-8 scroll-mt-24">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-serif text-stone-800">Lista de Presentes</h2>
                        <p className="text-stone-500">Escolha um item para nos presentear</p>
                    </div>

                    <div className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-stone-100/50">
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
                                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Search className="h-10 w-10 text-stone-300" />
                                </div>
                                <h3 className="text-stone-900 font-medium text-lg mb-2">Nenhum presente encontrado</h3>
                                <p className="text-stone-500">
                                    {searchTerm ? "Tente buscar por outro termo." : "A lista de presentes está sendo preparada."}
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredGifts.map((gift) => (
                                    <motion.div
                                        key={gift.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <GiftCard
                                            gift={gift}
                                            onSelect={setSelectedGift}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </section>

                {/* Contact Section */}
                <section className="py-12 border-t border-stone-200">
                    <div className="text-center space-y-8">
                        <h2 className="text-2xl font-serif text-stone-800">Ficou com alguma dúvida?</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            {config?.contact_phone_gabriel && (
                                <Button variant="outline" className="h-12 rounded-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" asChild>
                                    <a href={`https://wa.me/${config.contact_phone_gabriel}`} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="mr-2 h-5 w-5" /> Falar com Gabriel
                                    </a>
                                </Button>
                            )}
                            {config?.contact_phone_raabe && (
                                <Button variant="outline" className="h-12 rounded-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" asChild>
                                    <a href={`https://wa.me/${config.contact_phone_raabe}`} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="mr-2 h-5 w-5" /> Falar com Raabe
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Reserved Gifts (Bottom) */}
                {reservedGifts.length > 0 && (
                    <section className="pt-8 pb-12">
                        <h2 className="text-center text-xs font-bold text-stone-400 uppercase tracking-widest mb-8">
                            Já Reservados ({reservedGifts.length})
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
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

            {/* Gift Reservation Modal - Responsive */}
            {isMobile ? (
                <Drawer open={!!selectedGift} onOpenChange={(open) => !open && setSelectedGift(null)}>
                    <DrawerContent>
                        <DrawerHeader className="text-left">
                            <DrawerTitle>Confirmar Presente</DrawerTitle>
                            <DrawerDescription>
                                Que legal! Você escolheu presentear com: <strong>{selectedGift?.item_name}</strong>.
                                Por favor, informe seu nome para marcarmos como reservado.
                            </DrawerDescription>
                        </DrawerHeader>
                        <form onSubmit={handleReserve} className="px-4">
                            <div className="space-y-4">
                                <Input
                                    value={reserveGuestName}
                                    onChange={(e) => setReserveGuestName(e.target.value)}
                                    placeholder="Seu Nome Completo"
                                    required
                                    autoFocus
                                    className="h-12 text-lg"
                                />
                            </div>
                            <DrawerFooter className="flex-row gap-2 px-0">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectedGift(null)}>Cancelar</Button>
                                <Button type="submit" disabled={isReserving} className="flex-1 bg-rose-500 hover:bg-rose-600">
                                    {isReserving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                                </Button>
                            </DrawerFooter>
                        </form>
                    </DrawerContent>
                </Drawer>
            ) : (
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
                            <div className="py-4 space-y-4">
                                <Input
                                    value={reserveGuestName}
                                    onChange={(e) => setReserveGuestName(e.target.value)}
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
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
                                    ) : "Confirmar Reserva"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* Presence Confirmation Modal - Responsive */}
            {isMobile ? (
                <Drawer open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                    <DrawerContent className="max-h-[85vh]">
                        <DrawerHeader className="text-left">
                            <DrawerTitle>Confirmar Presença</DrawerTitle>
                            <DrawerDescription>
                                Ficaremos muito felizes em ter você conosco! ❤️
                            </DrawerDescription>
                        </DrawerHeader>
                        <form onSubmit={handleConfirmPresence} className="px-4 overflow-y-auto">
                            <div className="space-y-6">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="guest-name-mobile">Seu Nome Completo</Label>
                                    <Input
                                        id="guest-name-mobile"
                                        value={confirmGuestName}
                                        onChange={(e) => {
                                            setConfirmGuestName(e.target.value);
                                            setShowSuggestions(e.target.value.length >= 2);
                                        }}
                                        onFocus={() => setShowSuggestions(confirmGuestName.length >= 2)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        placeholder="Digite seu nome..."
                                        autoComplete="off"
                                        required
                                        className="h-11"
                                    />
                                    {showSuggestions && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {guests
                                                .filter(g => g.name.toLowerCase().includes(confirmGuestName.toLowerCase()))
                                                .slice(0, 5)
                                                .map(guest => (
                                                    <button
                                                        key={guest.id}
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center justify-between text-sm"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setConfirmGuestName(guest.name);
                                                            setShowSuggestions(false);
                                                        }}
                                                    >
                                                        <span>{guest.name}</span>
                                                        {guest.confirmed && (
                                                            <span className="text-xs text-green-600 flex items-center gap-1">
                                                                <Heart className="h-3 w-3 fill-green-600" /> Confirmado
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            {guests.filter(g => g.name.toLowerCase().includes(confirmGuestName.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-2 text-sm text-stone-500">
                                                    Nenhum convidado encontrado. Você será adicionado à lista.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {hasTwoLocations ? (
                                    <div className="space-y-3">
                                        <Label>Qual local você irá comparecer?</Label>
                                        <RadioGroup value={selectedLocation || ""} onValueChange={(v: "local1" | "local2") => setSelectedLocation(v)} required>
                                            <div className={`flex items-start space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${selectedLocation === 'local1' ? 'border-rose-500 bg-rose-50' : 'border-stone-200'}`}>
                                                <RadioGroupItem value="local1" id="r1m" className="mt-1" />
                                                <Label htmlFor="r1m" className="cursor-pointer w-full">
                                                    <div className="font-medium text-stone-900">{config?.bridal_shower_location || "Local 1"}</div>
                                                    <div className="text-xs text-stone-500 mt-1">
                                                        {config?.bridal_shower_date ? new Date(config.bridal_shower_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                    </div>
                                                </Label>
                                            </div>
                                            <div className={`flex items-start space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${selectedLocation === 'local2' ? 'border-rose-500 bg-rose-50' : 'border-stone-200'}`}>
                                                <RadioGroupItem value="local2" id="r2m" className="mt-1" />
                                                <Label htmlFor="r2m" className="cursor-pointer w-full">
                                                    <div className="font-medium text-stone-900">{config?.bridal_shower_location_2 || "Local 2"}</div>
                                                    <div className="text-xs text-stone-500 mt-1">
                                                        {config?.bridal_shower_date_2 ? new Date(config.bridal_shower_date_2).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                    </div>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                ) : (
                                    <div className="bg-stone-50 p-3 rounded-lg text-sm text-stone-600 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-rose-500" />
                                        Confirmando presença em: <strong>{config?.bridal_shower_location || "Local Principal"}</strong>
                                    </div>
                                )}
                            </div>
                            <DrawerFooter className="flex-row gap-2 px-0">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isConfirming} className="flex-1 bg-rose-500 hover:bg-rose-600">
                                    {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                                </Button>
                            </DrawerFooter>
                        </form>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Presença</DialogTitle>
                            <DialogDescription>
                                Ficaremos muito felizes em ter você conosco! ❤️
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleConfirmPresence}>
                            <div className="py-4 space-y-6">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="guest-name">Seu Nome Completo</Label>
                                    <Input
                                        id="guest-name"
                                        value={confirmGuestName}
                                        onChange={(e) => {
                                            setConfirmGuestName(e.target.value);
                                            setShowSuggestions(e.target.value.length >= 2);
                                        }}
                                        onFocus={() => setShowSuggestions(confirmGuestName.length >= 2)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        placeholder="Digite seu nome..."
                                        autoComplete="off"
                                        required
                                        className="h-11"
                                    />
                                    {showSuggestions && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {guests
                                                .filter(g => g.name.toLowerCase().includes(confirmGuestName.toLowerCase()))
                                                .slice(0, 5)
                                                .map(guest => (
                                                    <button
                                                        key={guest.id}
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center justify-between text-sm"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setConfirmGuestName(guest.name);
                                                            setShowSuggestions(false);
                                                        }}
                                                    >
                                                        <span>{guest.name}</span>
                                                        {guest.confirmed && (
                                                            <span className="text-xs text-green-600 flex items-center gap-1">
                                                                <Heart className="h-3 w-3 fill-green-600" /> Confirmado
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            {guests.filter(g => g.name.toLowerCase().includes(confirmGuestName.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-2 text-sm text-stone-500">
                                                    Nenhum convidado encontrado. Você será adicionado à lista.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {hasTwoLocations ? (
                                    <div className="space-y-3">
                                        <Label>Qual local você irá comparecer?</Label>
                                        <RadioGroup value={selectedLocation || ""} onValueChange={(v: "local1" | "local2") => setSelectedLocation(v)} required>
                                            <div className={`flex items-start space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${selectedLocation === 'local1' ? 'border-rose-500 bg-rose-50' : 'border-stone-200'}`}>
                                                <RadioGroupItem value="local1" id="r1" className="mt-1" />
                                                <Label htmlFor="r1" className="cursor-pointer w-full">
                                                    <div className="font-medium text-stone-900">{config?.bridal_shower_location || "Local 1"}</div>
                                                    <div className="text-xs text-stone-500 mt-1">
                                                        {config?.bridal_shower_date ? new Date(config.bridal_shower_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                    </div>
                                                </Label>
                                            </div>
                                            <div className={`flex items-start space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${selectedLocation === 'local2' ? 'border-rose-500 bg-rose-50' : 'border-stone-200'}`}>
                                                <RadioGroupItem value="local2" id="r2" className="mt-1" />
                                                <Label htmlFor="r2" className="cursor-pointer w-full">
                                                    <div className="font-medium text-stone-900">{config?.bridal_shower_location_2 || "Local 2"}</div>
                                                    <div className="text-xs text-stone-500 mt-1">
                                                        {config?.bridal_shower_date_2 ? new Date(config.bridal_shower_date_2).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                    </div>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                ) : (
                                    <div className="bg-stone-50 p-3 rounded-lg text-sm text-stone-600 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-rose-500" />
                                        Confirmando presença em: <strong>{config?.bridal_shower_location || "Local Principal"}</strong>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isConfirming} className="bg-rose-500 hover:bg-rose-600">
                                    {isConfirming ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
                                    ) : "Confirmar Minha Presença"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* Success Modal */}
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

            {/* Confirmation Success Modal */}
            <Dialog open={showConfirmSuccessModal} onOpenChange={setShowConfirmSuccessModal}>
                <DialogContent className="sm:max-w-md text-center">
                    <div className="flex justify-center my-4">
                        <div className="h-20 w-20 bg-rose-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                            <Heart className="h-10 w-10 text-rose-500 fill-rose-500" />
                        </div>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-serif text-stone-800">
                            Presença Confirmada! 🎉
                        </DialogTitle>
                        <DialogDescription className="text-center text-base pt-2 text-stone-600">
                            <strong>{confirmSuccessData?.guestName}</strong>, sua presença está confirmada para o Chá de Casa Nova em <strong>{confirmSuccessData?.locationName}</strong>!
                            <br /><br />
                            Estamos ansiosos para celebrar esse momento com você!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center mt-4">
                        <Button onClick={() => setShowConfirmSuccessModal(false)} className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white">
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
