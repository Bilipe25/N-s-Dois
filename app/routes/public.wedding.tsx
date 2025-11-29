import { useState, useEffect } from "react";
import { Form, useLoaderData, useActionData, useNavigation, Link, useFetcher } from "react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { MapPin, Gift, Info, Calendar, Music, Heart, MessageCircle, ExternalLink, PartyPopper, Loader2, Check, Search, UserPlus, User, CalendarPlus, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { sendPushToUser } from "@/services/push.server";
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
    const supabase = createClient(request);

    if (intent === "search") {
        const query = formData.get("query") as string;
        if (!query || query.length < 2) return { searchResults: [] };

        const { data: guests } = await supabase
            .from("guests")
            .select("id, name, adults_count, children_count, rsvp_status")
            .ilike("name", `%${query}%`)
            .limit(5);

        return { searchResults: guests || [] };
    }

    if (intent === "rsvp") {
        const guestId = formData.get("guest_id") as string;
        const name = formData.get("name") as string;
        const adultsCount = Number(formData.get("adults_count"));
        const childrenCount = Number(formData.get("children_count") || 0);
        const message = formData.get("message") as string;

        let error;

        if (guestId && guestId !== "new") {
            // Update existing guest
            const { error: updateError } = await supabase
                .from("guests")
                .update({
                    adults_count: adultsCount,
                    children_count: childrenCount,
                    message: message,
                    rsvp_status: "confirmado"
                })
                .eq("id", guestId);
            error = updateError;
        } else {
            // Insert new guest
            const { error: insertError } = await supabase
                .from("guests")
                .insert({
                    name,
                    adults_count: adultsCount,
                    children_count: childrenCount,
                    message: message,
                    rsvp_status: "confirmado",
                    type: "convidado"
                });
            error = insertError;
        }

        if (error) {
            console.error("RSVP Error:", error);
            return { error: "Erro ao confirmar presença. Tente novamente." };
        }

        // Create notification
        await supabase.from("notifications").insert({
            type: "rsvp",
            title: "Nova Confirmação de Presença 🎉",
            message: `${name} confirmou presença para ${adultsCount + childrenCount} pessoas.`,
            link: "/guests"
        });

        // Enviar Push para Gabriel e Raabe
        await sendPushToUser(request, "Gabriel", "Nova Confirmação de Presença 🎉", `${name} confirmou presença para ${adultsCount + childrenCount} pessoas.`, "/guests");
        await sendPushToUser(request, "Raabe", "Nova Confirmação de Presença 🎉", `${name} confirmou presença para ${adultsCount + childrenCount} pessoas.`, "/guests");

        return { success: true, guestName: name };
    }

    return null;
};

const photos = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519225468359-2996bc01c34c?q=80&w=2070&auto=format&fit=crop",
];

// Countdown Component
const Countdown = ({ targetDate }: { targetDate: string }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
                horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
                min: Math.floor((difference / 1000 / 60) % 60),
                seg: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState<any>(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents = Object.keys(timeLeft).map((interval) => {
        if (!timeLeft[interval]) {
            return null;
        }

        return (
            <div key={interval} className="flex flex-col items-center mx-2 md:mx-4">
                <span className="text-2xl md:text-4xl font-serif font-bold text-white drop-shadow-md">
                    {timeLeft[interval]}
                </span>
                <span className="text-xs md:text-sm uppercase tracking-widest text-white/80">
                    {interval}
                </span>
            </div>
        );
    });

    return (
        <div className="flex justify-center items-center mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            {timerComponents.length ? timerComponents : <span className="text-2xl text-white">Chegou o grande dia! ❤️</span>}
        </div>
    );
};

export default function PublicWedding() {
    const { weddingAddress, weddingDate } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // RSVP Flow State
    const [rsvpStep, setRsvpStep] = useState<"search" | "select" | "details">("search");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGuest, setSelectedGuest] = useState<any>(null);
    const fetcher = useFetcher<typeof action>();
    const isSearching = fetcher.state === "submitting";
    const searchResults = fetcher.data?.searchResults || [];

    // Parallax Effect
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    useEffect(() => {
        if (actionData?.success) {
            setShowSuccessModal(true);
            setRsvpStep("search");
            setSearchQuery("");
            setSelectedGuest(null);
        }
    }, [actionData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.length < 2) return;
        fetcher.submit({ intent: "search", query: searchQuery }, { method: "post" });
        setRsvpStep("select");
    };

    const handleGuestSelect = (guest: any) => {
        setSelectedGuest(guest);
        setRsvpStep("details");
    };

    const handleNewGuest = () => {
        setSelectedGuest({ id: "new", name: searchQuery });
        setRsvpStep("details");
    };

    const addToCalendarUrl = () => {
        const title = encodeURIComponent("Casamento Gabriel & Raabe");
        const details = encodeURIComponent("Celebrando o amor de Gabriel e Raabe. Esperamos você!");
        const location = encodeURIComponent(weddingAddress);
        const startDate = new Date(weddingDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endDate = new Date(new Date(weddingDate).getTime() + 4 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // +4 hours

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`;
    };

    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" as const }
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
        <div className="min-h-screen bg-[#FDFCF8] font-sans text-stone-800 overflow-x-hidden selection:bg-rose-200">
            {/* Hero Section with Video Background */}
            <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover opacity-90 scale-105"
                        poster={photos[0]}
                    >
                        <source src="https://videos.pexels.com/video-files/5699956/5699956-hd_1080_1920_30fps.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 text-center text-white space-y-8 px-4 w-full max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        <p className="text-sm md:text-lg tracking-[0.3em] uppercase text-white/90 font-light">Vamos nos casar</p>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif leading-tight drop-shadow-lg">
                            Gabriel <span className="text-rose-200">&</span> Raabe
                        </h1>
                        <div className="flex items-center justify-center gap-4 text-xl md:text-2xl font-light text-white/90">
                            <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                            <p>
                                {new Date(weddingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                    >
                        <Countdown targetDate={weddingDate} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="pt-8 flex flex-col md:flex-row gap-4 justify-center items-center"
                    >
                        <Dialog onOpenChange={(open) => {
                            if (!open) {
                                setTimeout(() => {
                                    setRsvpStep("search");
                                    setSearchQuery("");
                                    setSelectedGuest(null);
                                }, 300);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="bg-white text-stone-900 hover:bg-stone-100 hover:text-rose-600 rounded-full px-10 py-7 text-lg shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-rose-100">
                                    Confirmar Presença
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="font-serif text-2xl text-center">Confirmar Presença</DialogTitle>
                                    <DialogDescription className="text-center">
                                        {rsvpStep === "search" && "Busque seu nome na lista de convidados."}
                                        {rsvpStep === "select" && "Selecione seu nome abaixo."}
                                        {rsvpStep === "details" && "Confirme os detalhes da sua presença."}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="py-4">
                                    {/* STEP 1: SEARCH */}
                                    {rsvpStep === "search" && (
                                        <form onSubmit={handleSearch} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="search">Seu Nome</Label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                                                    <Input
                                                        id="search"
                                                        placeholder="Digite seu nome..."
                                                        className="pl-9"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full" disabled={searchQuery.length < 2 || isSearching}>
                                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                                            </Button>
                                        </form>
                                    )}

                                    {/* STEP 2: SELECT */}
                                    {rsvpStep === "select" && (
                                        <div className="space-y-4">
                                            {searchResults.length > 0 ? (
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                                    {searchResults.map((guest: any) => (
                                                        <Button
                                                            key={guest.id}
                                                            variant="outline"
                                                            className="w-full justify-start h-auto py-3 px-4 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                                                            onClick={() => handleGuestSelect(guest)}
                                                        >
                                                            <User className="mr-3 h-5 w-5 text-stone-400" />
                                                            <div className="text-left">
                                                                <div className="font-medium">{guest.name}</div>
                                                                <div className="text-xs text-stone-500">
                                                                    {guest.rsvp_status === "confirmado" ? "Já confirmado ✅" : "Pendente"}
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                                                    <p className="text-stone-500 mb-2">Nenhum convidado encontrado com "{searchQuery}".</p>
                                                    <p className="text-xs text-stone-400">Tente buscar apenas pelo primeiro nome.</p>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t">
                                                <Button variant="ghost" className="w-full text-stone-600 hover:text-rose-600 hover:bg-rose-50" onClick={handleNewGuest}>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Não encontrei meu nome (Novo Cadastro)
                                                </Button>
                                            </div>
                                            <Button variant="link" className="w-full text-stone-400" onClick={() => setRsvpStep("search")}>
                                                Voltar para busca
                                            </Button>
                                        </div>
                                    )}

                                    {/* STEP 3: DETAILS */}
                                    {rsvpStep === "details" && (
                                        <Form method="post" className="space-y-4">
                                            <input type="hidden" name="guest_id" value={selectedGuest?.id || "new"} />

                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nome Completo</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    defaultValue={selectedGuest?.name}
                                                    readOnly={selectedGuest?.id !== "new"}
                                                    className={selectedGuest?.id !== "new" ? "bg-stone-100" : ""}
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="adults_count">Adultos</Label>
                                                    <Input
                                                        id="adults_count"
                                                        name="adults_count"
                                                        type="number"
                                                        min="1"
                                                        defaultValue={selectedGuest?.adults_count || 1}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="children_count">Crianças</Label>
                                                    <Input
                                                        id="children_count"
                                                        name="children_count"
                                                        type="number"
                                                        min="0"
                                                        defaultValue={selectedGuest?.children_count || 0}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="message">Mensagem aos Noivos (Opcional)</Label>
                                                <Textarea id="message" name="message" placeholder="Deixe um recadinho carinhoso..." className="resize-none" />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <Button type="button" variant="outline" onClick={() => setRsvpStep("search")} className="flex-1">
                                                    Voltar
                                                </Button>
                                                <Button type="submit" name="intent" value="rsvp" className="flex-[2] bg-stone-900 hover:bg-stone-800" disabled={isSubmitting}>
                                                    {isSubmitting ? (
                                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
                                                    ) : (
                                                        "Confirmar Presença"
                                                    )}
                                                </Button>
                                            </div>
                                        </Form>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="outline"
                            size="lg"
                            className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:text-white rounded-full px-8 py-7 text-lg"
                            asChild
                        >
                            <a href={addToCalendarUrl()} target="_blank" rel="noopener noreferrer">
                                <CalendarPlus className="mr-2 h-5 w-5" />
                                Salvar na Agenda
                            </a>
                        </Button>
                    </motion.div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/70">
                    <span className="text-sm tracking-widest uppercase">Role para ver mais</span>
                </div>
            </section>

            {/* Photo Slider Section */}
            <section className="py-24 bg-[#FDFCF8] relative overflow-hidden">
                <motion.div style={{ y: y1 }} className="absolute top-0 left-0 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
                <motion.div style={{ y: y2 }} className="absolute bottom-0 right-0 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-30 translate-x-1/3 translate-y-1/3" />

                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-rose-400 uppercase tracking-widest text-sm font-medium">Momentos Especiais</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-stone-800 mt-3 mb-6">Nossa História</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-rose-200 to-amber-200 mx-auto rounded-full" />
                    </div>

                    <Swiper
                        modules={[Autoplay, EffectFade, Navigation, Pagination]}
                        effect="fade"
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        className="w-full h-[400px] md:h-[600px] rounded-2xl shadow-2xl"
                    >
                        {photos.map((photo, index) => (
                            <SwiperSlide key={index}>
                                <div className="w-full h-full relative group">
                                    <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Information Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* Location Card */}
                    <motion.div variants={fadeIn}>
                        <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-white group overflow-hidden rounded-2xl">
                            <CardContent className="p-10 flex flex-col items-center text-center h-full justify-between relative">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-200 to-amber-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <div className="mb-8 bg-amber-50 p-5 rounded-full group-hover:bg-amber-100 transition-colors duration-300 group-hover:scale-110 transform">
                                    <MapPin className="w-10 h-10 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif mb-4 text-stone-800">Local</h3>
                                    <p className="text-stone-600 text-base mb-8 leading-relaxed font-light">
                                        {weddingAddress}
                                        <br />
                                        <span className="text-sm text-amber-600/80 mt-2 block font-medium">Clique para ver no mapa</span>
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full border-stone-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 rounded-full py-6 transition-all" asChild>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(weddingAddress)}`} target="_blank" rel="noopener noreferrer">
                                        Ver no Google Maps
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Gifts Card */}
                    <motion.div variants={fadeIn}>
                        <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-white group overflow-hidden rounded-2xl">
                            <CardContent className="p-10 flex flex-col items-center text-center h-full justify-between relative">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-200 to-emerald-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <div className="mb-8 bg-emerald-50 p-5 rounded-full group-hover:bg-emerald-100 transition-colors duration-300 group-hover:scale-110 transform">
                                    <Gift className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif mb-4 text-stone-800">Lista de Presentes</h3>
                                    <p className="text-stone-600 text-base mb-8 leading-relaxed font-light">
                                        Sua presença é nosso maior presente! Mas se desejar nos presentear, criamos uma lista com muito carinho.
                                    </p>
                                </div>
                                <Link to="/public/bridal-shower" className="w-full">
                                    <Button variant="outline" className="w-full border-stone-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-full py-6 transition-all">
                                        Ver Lista de Presentes
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Dress Code Card */}
                    <motion.div variants={fadeIn}>
                        <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-white group overflow-hidden rounded-2xl">
                            <CardContent className="p-10 flex flex-col items-center text-center h-full justify-between relative">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-200 to-purple-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <div className="mb-8 bg-purple-50 p-5 rounded-full group-hover:bg-purple-100 transition-colors duration-300 group-hover:scale-110 transform">
                                    <Info className="w-10 h-10 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif mb-4 text-stone-800">Dress Code</h3>
                                    <p className="text-stone-600 text-base mb-8 leading-relaxed font-light">
                                        <span className="font-medium text-purple-700 block text-lg mb-2">Esporte Fino</span>
                                        Queremos que vocês se sintam lindos e confortáveis para celebrar conosco!
                                    </p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full border-stone-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 rounded-full py-6 transition-all">
                                            Ver Guia de Trajes
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="font-serif text-2xl text-center pb-2">Guia de Trajes: Esporte Fino</DialogTitle>
                                            <DialogDescription className="text-center">
                                                Inspirações para você arrasar no nosso grande dia.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                                            <div className="space-y-4 bg-rose-50/50 p-6 rounded-xl border border-rose-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-700">💃</div>
                                                    <h4 className="font-serif text-xl text-stone-800">Para Elas</h4>
                                                </div>
                                                <ul className="space-y-3 text-sm text-stone-600">
                                                    <li className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-rose-400 mt-0.5" />
                                                        <span>Vestidos longos, midi ou macacões elegantes.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-rose-400 mt-0.5" />
                                                        <span>Tecidos fluidos, rendas e brilhos discretos.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-rose-400 mt-0.5" />
                                                        <span>Salto alto ou grosso para maior conforto.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2 text-red-500/80 font-medium">
                                                        <span className="text-xs border border-red-200 bg-red-50 px-1.5 py-0.5 rounded">Evitar</span>
                                                        <span>Branco, Off-white e tons muito claros.</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="space-y-4 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700">🕺</div>
                                                    <h4 className="font-serif text-xl text-stone-800">Para Eles</h4>
                                                </div>
                                                <ul className="space-y-3 text-sm text-stone-600">
                                                    <li className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-blue-400 mt-0.5" />
                                                        <span>Terno completo (com ou sem gravata).</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-blue-400 mt-0.5" />
                                                        <span>Calça social ou sarja com camisa social.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-blue-400 mt-0.5" />
                                                        <span>Blazer é uma ótima opção para compor o look.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2 text-red-500/80 font-medium">
                                                        <span className="text-xs border border-red-200 bg-red-50 px-1.5 py-0.5 rounded">Evitar</span>
                                                        <span>Jeans, bermudas, camisetas e tênis esportivos.</span>
                                                    </li>
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
            <section className="py-24 px-4 bg-white relative">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-rose-400 uppercase tracking-widest text-sm font-medium">Cronograma</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-stone-800 mt-3 mb-16">O Grande Dia</h2>

                        <div className="relative border-l-2 border-rose-100 ml-6 md:ml-auto md:mx-auto pl-8 md:pl-0 space-y-16 md:space-y-24">
                            {[
                                { time: "16:00", title: "Cerimônia", icon: Heart, desc: "O momento do 'Sim'" },
                                { time: "17:30", title: "Fotos & Coquetel", icon: Calendar, desc: "Registrando memórias e brindando" },
                                { time: "19:00", title: "Jantar", icon: Gift, desc: "Uma refeição especial" },
                                { time: "21:00", title: "Festa", icon: Music, desc: "Hora de celebrar na pista!" },
                            ].map((item, idx) => (
                                <div key={idx} className="relative md:flex items-center justify-center group">
                                    <div className="absolute -left-[41px] md:left-1/2 md:-translate-x-1/2 w-5 h-5 rounded-full bg-white border-4 border-rose-200 group-hover:border-rose-400 group-hover:scale-125 transition-all duration-300 z-10 shadow-sm" />

                                    <div className="md:w-1/2 md:text-right md:pr-16">
                                        <div className="md:group-hover:-translate-x-2 transition-transform duration-300">
                                            <span className="text-3xl font-serif text-rose-400 font-medium block">{item.time}</span>
                                            <span className="text-sm text-stone-400 hidden md:block mt-1">{item.desc}</span>
                                        </div>
                                    </div>

                                    <div className="md:w-1/2 md:text-left md:pl-16 mt-2 md:mt-0">
                                        <div className="md:group-hover:translate-x-2 transition-transform duration-300">
                                            <h3 className="text-xl font-medium text-stone-700 flex items-center gap-3 md:justify-start">
                                                <span className="md:hidden bg-rose-50 p-1.5 rounded-full"><item.icon className="w-4 h-4 text-rose-400" /></span>
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-stone-400 md:hidden mt-1 ml-9">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#1c1917] text-stone-400 py-16 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-serif text-white">Gabriel & Raabe</h2>
                    <p className="text-base max-w-md mx-auto leading-relaxed text-stone-300">
                        "O amor é paciente, o amor é bondoso. Tudo sofre, tudo crê, tudo espera, tudo suporta."
                        <br /><span className="text-stone-500 text-sm mt-2 block">- 1 Coríntios 13</span>
                    </p>

                    <div className="flex justify-center gap-6 pt-6">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-white transition-colors" asChild>
                            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="w-6 h-6" />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-white transition-colors">
                            <ExternalLink className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="pt-12 border-t border-white/10 text-xs opacity-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>© 2025 Nós Dois. Todos os direitos reservados.</p>
                        <p>Feito com ❤️ para o nosso dia.</p>
                    </div>
                </div>
            </footer>

            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md text-center">
                    <div className="flex justify-center my-6">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                            <PartyPopper className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-serif text-stone-800">Presença Confirmada! 🎉</DialogTitle>
                        <DialogDescription className="text-center text-base pt-3 leading-relaxed">
                            Obrigado, <strong>{actionData?.guestName}</strong>!
                            <br />
                            Sua presença fará nosso dia ainda mais especial.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center mt-6">
                        <Button onClick={() => setShowSuccessModal(false)} className="w-full sm:w-auto bg-stone-900 text-white hover:bg-stone-800 rounded-full px-8">
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
