import { useState, useEffect } from "react";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { MapPin, Gift, Info, Calendar, Music, Heart, MessageCircle, ExternalLink, PartyPopper, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { Route } from "./+types/public.wedding";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Gabriel & Raabe - Nosso Casamento" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: config } = await supabase
        .from("app_config")
        .select("wedding_address, wedding_date")
        .single();

    return {
        weddingAddress: config?.wedding_address || "Local a definir",
        weddingDate: config?.wedding_date || "2025-09-20 16:00:00-03"
    };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "rsvp") {
        const name = formData.get("name") as string;
        const guestsCount = Number(formData.get("guests_count"));
        const message = formData.get("message") as string;

        const supabase = createClient(request);

        // Insert guest into database
        const { error } = await supabase
            .from("guests")
            .insert({
                name,
                total_guests: guestsCount,
                message,
                confirmed: true,
                type: "convidado", // Default type
                status: "confirmado"
            });

        if (error) {
            return { error: "Erro ao confirmar presença. Tente novamente." };
        }

        return { success: true, guestName: name };
    }

    return null;
};

const photos = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519225468359-2996bc01c34c?q=80&w=2070&auto=format&fit=crop",
];

export default function PublicWedding() {
    const { weddingAddress, weddingDate } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        if (actionData?.success) {
            setShowSuccessModal(true);
        }
    }, [actionData]);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" as const }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-800 overflow-x-hidden">
            {/* Hero Section with Video Background */}
            <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover opacity-90"
                        poster={photos[0]}
                    >
                        <source src="https://videos.pexels.com/video-files/5699956/5699956-hd_1080_1920_30fps.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div className="absolute inset-0 bg-black/30" />
                </div>

                <div className="relative z-10 text-center text-white space-y-6 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                    >
                        <p className="text-lg md:text-xl tracking-[0.2em] uppercase mb-4">Vamos nos casar</p>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-6">Gabriel & Raabe</h1>
                        <p className="text-xl md:text-2xl font-light">
                            {new Date(weddingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1.5 }}
                        className="pt-8"
                    >
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="lg" className="bg-white text-stone-900 hover:bg-stone-100 rounded-full px-8 py-6 text-lg transition-all transform hover:scale-105">
                                    Confirmar Presença
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Confirmar Presença</DialogTitle>
                                    <DialogDescription>
                                        Ficaremos muito felizes com a sua presença!
                                    </DialogDescription>
                                </DialogHeader>
                                <Form method="post" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome Completo</Label>
                                        <Input id="name" name="name" placeholder="Seu nome" required />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="guests_count">Total de Pessoas (incluindo você)</Label>
                                        <Input id="guests_count" name="guests_count" type="number" min="1" defaultValue="1" required />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Mensagem aos Noivos (Opcional)</Label>
                                        <Textarea id="message" name="message" placeholder="Deixe um recadinho..." />
                                    </div>

                                    <Button type="submit" name="intent" value="rsvp" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
                                        ) : (
                                            "Confirmar Minha Presença"
                                        )}
                                    </Button>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </motion.div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/70">
                    <span className="text-sm tracking-widest uppercase">Role para ver mais</span>
                </div>
            </section>

            {/* Photo Slider Section */}
            <section className="py-20 bg-stone-100">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-serif text-stone-800 mb-4">Nossa História</h2>
                        <div className="w-20 h-1 bg-rose-300 mx-auto" />
                    </div>

                    <Swiper
                        modules={[Autoplay, EffectFade, Navigation, Pagination]}
                        effect="fade"
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        className="w-full h-[400px] md:h-[600px] rounded-xl shadow-2xl"
                    >
                        {photos.map((photo, index) => (
                            <SwiperSlide key={index}>
                                <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Information Grid */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* Location Card */}
                    <motion.div variants={fadeIn}>
                        <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden">
                            <CardContent className="p-8 flex flex-col items-center text-center h-full justify-between relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 to-amber-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <div className="mb-6 bg-amber-50 p-4 rounded-full group-hover:bg-amber-100 transition-colors">
                                    <MapPin className="w-8 h-8 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-serif mb-3">Local</h3>
                                    <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                                        {weddingAddress}
                                        <br />
                                        <span className="text-xs opacity-70">Clique para ver no mapa</span>
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full border-stone-200 hover:bg-stone-50 text-stone-700 rounded-full" asChild>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(weddingAddress)}`} target="_blank" rel="noopener noreferrer">
                                        Ver no Maps
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Gifts Card */}
                    <motion.div variants={fadeIn}>
                        <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden">
                            <CardContent className="p-8 flex flex-col items-center text-center h-full justify-between relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-200 to-emerald-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <div className="mb-6 bg-emerald-50 p-4 rounded-full group-hover:bg-emerald-100 transition-colors">
                                    <Gift className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-serif mb-3">Lista de Presentes</h3>
                                    <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                                        Para nos ajudar a montar nosso lar doce lar.
                                    </p>
                                </div>
                                <Link to="/public/bridal-shower" className="w-full">
                                    <Button variant="outline" className="w-full border-stone-200 hover:bg-stone-50 text-stone-700 rounded-full">
                                        Ver Lista
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Dress Code Card */}
                    <motion.div variants={fadeIn}>
                        <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden">
                            <CardContent className="p-8 flex flex-col items-center text-center h-full justify-between relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-200 to-purple-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <div className="mb-6 bg-purple-50 p-4 rounded-full group-hover:bg-purple-100 transition-colors">
                                    <Info className="w-8 h-8 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-serif mb-3">Dress Code</h3>
                                    <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                                        Esporte Fino.
                                        <br />
                                        <span className="text-xs opacity-70">Evite branco, off-white e tons muito claros.</span>
                                    </p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full border-stone-200 hover:bg-stone-50 text-stone-700 rounded-full">
                                            Ver Detalhes
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Dress Code: Esporte Fino</DialogTitle>
                                            <DialogDescription>
                                                Queremos que vocês se sintam lindos e confortáveis!
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-4 py-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-stone-800">Para Elas 💃</h4>
                                                <ul className="text-sm text-stone-600 list-disc list-inside space-y-1">
                                                    <li>Vestidos longos ou midi</li>
                                                    <li>Tecidos fluidos</li>
                                                    <li>Estampas delicadas</li>
                                                    <li>Evitar: Branco/Off-white</li>
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-stone-800">Para Eles 🕺</h4>
                                                <ul className="text-sm text-stone-600 list-disc list-inside space-y-1">
                                                    <li>Calça social ou sarja</li>
                                                    <li>Camisa social</li>
                                                    <li>Blazer (opcional)</li>
                                                    <li>Evitar: Jeans, Tênis esportivo</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </section>

            {/* Schedule Section */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-serif text-stone-800 mb-12">Programação</h2>

                        <div className="relative border-l-2 border-rose-100 ml-1/2 md:ml-auto md:mx-auto pl-8 md:pl-0 space-y-12">
                            {[
                                { time: "16:00", title: "Cerimônia", icon: Heart },
                                { time: "17:30", title: "Fotos & Coquetel", icon: Calendar },
                                { time: "19:00", title: "Jantar", icon: Gift },
                                { time: "21:00", title: "Festa", icon: Music },
                            ].map((item, idx) => (
                                <div key={idx} className="relative md:flex items-center justify-center group">
                                    <div className="absolute -left-[41px] md:left-1/2 md:-translate-x-1/2 w-5 h-5 rounded-full bg-white border-4 border-rose-200 group-hover:border-rose-400 transition-colors z-10" />

                                    <div className="md:w-1/2 md:text-right md:pr-12">
                                        <span className="text-2xl font-serif text-rose-400 font-medium">{item.time}</span>
                                    </div>

                                    <div className="md:w-1/2 md:text-left md:pl-12 mt-1 md:mt-0">
                                        <h3 className="text-lg font-medium text-stone-700 flex items-center gap-2 md:justify-start">
                                            <span className="md:hidden"><item.icon className="w-4 h-4 text-rose-300" /></span>
                                            {item.title}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-stone-900 text-stone-400 py-12 px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-6">
                    <h2 className="text-2xl font-serif text-white">Gabriel & Raabe</h2>
                    <p className="text-sm max-w-md mx-auto">
                        Estamos muito felizes em compartilhar este momento único com vocês.
                        Esperamos vocês lá!
                    </p>

                    <div className="flex justify-center gap-4 pt-4">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-white">
                            <MessageCircle className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-white">
                            <ExternalLink className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="pt-8 border-t border-white/10 text-xs opacity-60">
                        <p>© 2025 Nós Dois. Feito com amor.</p>
                    </div>
                </div>
            </footer>

            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md text-center">
                    <div className="flex justify-center my-4">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <PartyPopper className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">Presença Confirmada! 🎉</DialogTitle>
                        <DialogDescription className="text-center text-base pt-2">
                            Obrigado, <strong>{actionData?.guestName}</strong>!
                            <br />
                            Estamos contando os dias para celebrar com você.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center mt-4">
                        <Button onClick={() => setShowSuccessModal(false)} className="w-full sm:w-auto">
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
