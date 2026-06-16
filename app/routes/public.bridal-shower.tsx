import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, Search } from "lucide-react";
import type { Route } from "./+types/public.bridal-shower";
import { GiftCard } from "@/components/bridal-shower/gift-card";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { PixModal } from "@/components/bridal-shower/pix-modal";
import { HeroSection } from "@/components/bridal-shower/hero-section";
import { LocationsSection } from "@/components/bridal-shower/locations-section";
import { ColorPaletteSection } from "@/components/bridal-shower/color-palette-section";
import { ContactSection } from "@/components/bridal-shower/contact-section";
import { ReservedGiftsSection } from "@/components/bridal-shower/reserved-gifts-section";
import { ConfirmPresenceModal } from "@/components/bridal-shower/confirm-presence-modal";
import { ReserveGiftModal } from "@/components/bridal-shower/reserve-gift-modal";
import { GiftProgressBar } from "@/components/bridal-shower/gift-progress-bar";
import { Countdown } from "@/components/bridal-shower/countdown";
import { useBridalData } from "@/hooks/useBridalShower";
import type { Gift } from "@/schemas/bridal-shower";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { createClient, hasSupabaseEnv } from "@/lib/supabase";
import type { LoaderFunctionArgs } from "react-router";

// Loader para buscar config (necessário para meta tags OG)
export const loader = async ({ request }: LoaderFunctionArgs) => {
    let heroUrl: string | null | undefined = null;

    if (hasSupabaseEnv()) {
        try {
            const supabase = createClient(request);
            const { data: config } = await supabase
                .from("app_config")
                .select("bridal_shower_hero_url")
                .single();

            heroUrl = config?.bridal_shower_hero_url;
        } catch (error) {
            console.error("Erro ao buscar hero do chá:", error);
        }
    }

    return {
        heroUrl,
        publicSiteUrl: process.env.PUBLIC_SITE_URL || new URL(request.url).origin
    };
};

export const meta: Route.MetaFunction = ({ data }) => {
    const title = "Chá de Casa Nova | Gabriel & Raabe 💍";
    const description = "Estamos montando nosso lar com muito amor! Venha celebrar conosco e, se desejar, escolha um presente para nos ajudar nessa nova jornada. ❤️";
    const defaultImage = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&h=630&auto=format&fit=crop";
    const ogImage = (data as { heroUrl?: string })?.heroUrl || defaultImage;
    const publicSiteUrl = ((data as { publicSiteUrl?: string })?.publicSiteUrl || "https://nosdois.vercel.app").replace(/\/$/, "");
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

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PublicBridalShower() {
    const { data: bridalData, isLoading } = useBridalData();
    const gifts = bridalData?.gifts || [];
    const config = bridalData?.config;

    // UI State
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Detect scroll for back-to-top button
    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Share handler with toast instead of alert
    const handleShare = useCallback(async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ url });
            } catch {
                // User cancelled or error
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast.success('Link copiado para a área de transferência!');
            } catch {
                prompt('Copie o link:', url);
            }
        }
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    // Gift filtering
    const availableGifts = gifts.filter((g) => g.status !== 'comprado');
    const reservedGifts = gifts.filter((g) => g.status === 'comprado');
    const filteredGifts = availableGifts.filter((g) => {
        const matchesSearch = g.item_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? g.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    if (isLoading) return <LoadingSkeleton />;

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
                            aria-label="Voltar ao topo"
                        >
                            <ChevronUp className="h-5 w-5 text-stone-600" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero */}
            <HeroSection
                config={config}
                onConfirmPresence={() => setShowConfirmModal(true)}
                onPix={() => setShowPixModal(true)}
                onShare={handleShare}
                scrollToSection={scrollToSection}
            />

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-4 space-y-16 -mt-10 relative z-10">
                <Countdown targetDate={config?.bridal_shower_date} />
                <LocationsSection config={config} />
                <ColorPaletteSection />

                {/* Gift List */}
                <section id="lista-presentes" className="space-y-8 scroll-mt-24">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-serif text-stone-800">Lista de Presentes</h2>
                        <p className="text-stone-500">Escolha um item para nos presentear</p>
                    </div>

                    <GiftProgressBar total={gifts.length} reserved={reservedGifts.length} />

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

                <ContactSection config={config} />
                <ReservedGiftsSection gifts={reservedGifts} />
            </main>

            {/* Footer */}
            <footer className="text-center py-8 text-stone-400 text-xs">
                <p>Feito com ❤️ por Nós Dois</p>
            </footer>

            {/* Modals */}
            <ReserveGiftModal
                gift={selectedGift}
                onClose={() => setSelectedGift(null)}
                isMobile={isMobile}
            />
            <ConfirmPresenceModal
                open={showConfirmModal}
                onOpenChange={setShowConfirmModal}
                config={config}
                isMobile={isMobile}
            />
            <PixModal
                open={showPixModal}
                onOpenChange={setShowPixModal}
                pixKey={config?.pix_key}
                isMobile={isMobile}
            />
        </div>
    );
}
