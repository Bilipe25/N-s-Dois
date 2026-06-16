import { Button } from "@/components/ui/button";
import { Heart, QrCode, MapPin, PartyPopper, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Config } from "@/schemas/bridal-shower";

const BRIDAL_HERO_FALLBACK = "https://images.unsplash.com/photo-1522673607200-1645062cd4d1?q=80&w=2070&auto=format&fit=crop";

interface HeroSectionProps {
    config?: Config;
    onConfirmPresence: () => void;
    onPix: () => void;
    onShare: () => void;
    scrollToSection: (id: string) => void;
}

export function HeroSection({ config, onConfirmPresence, onPix, onShare, scrollToSection }: HeroSectionProps) {
    return (
        <header className="relative bg-stone-900 border-b border-stone-100 overflow-hidden min-h-[82svh] flex items-center justify-center">
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.4 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0"
            >
                <img
                    src={config?.bridal_shower_hero_url || BRIDAL_HERO_FALLBACK}
                    alt="Foto de Gabriel e Raabe - Chá de Casa Nova"
                    className="w-full h-full object-cover"
                    fetchPriority="high"
                    onError={(event) => {
                        if (event.currentTarget.src !== BRIDAL_HERO_FALLBACK) {
                            event.currentTarget.src = BRIDAL_HERO_FALLBACK;
                        } else {
                            event.currentTarget.style.display = "none";
                        }
                    }}
                />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-stone-900/20" />

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
                        onClick={onConfirmPresence}
                        className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-8 h-14 text-base sm:text-lg shadow-lg hover:shadow-rose-500/25 transition-all hover:-translate-y-1 w-full font-medium"
                    >
                        <Heart className="mr-2 h-5 w-5 fill-current" /> Confirmar Presença
                    </Button>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
                        <Button
                            variant="outline"
                            onClick={onPix}
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
                            aria-label="Ver paleta de cores sugerida"
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
                            onClick={onShare}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full h-12 transition-all hover:-translate-y-1 text-sm col-span-2 sm:col-span-1"
                        >
                            <Share2 className="mr-1.5 h-4 w-4" /> Compartilhar
                        </Button>
                    </div>
                </motion.div>
            </div>
        </header>
    );
}
