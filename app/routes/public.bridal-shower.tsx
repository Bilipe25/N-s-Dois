import { useState, useEffect } from "react";
import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Gift, MapPin, Calendar, Link as LinkIcon, ExternalLink, Check, Heart, Search, Loader2, PartyPopper } from "lucide-react";
import type { Route } from "./+types/public.bridal-shower";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Chá de Casa Nova - Lista de Presentes" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);

    const [giftsResult, configResult] = await Promise.all([
        supabase.from("bridal_shower_gifts").select("*").order("item_name"),
        supabase.from("app_config").select("bridal_shower_date, bridal_shower_location").single()
    ]);

    return {
        gifts: giftsResult.data || [],
        config: configResult.data
    };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "reserve_gift") {
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;

        if (name) {
            // Fetch gift details for notification
            const { data: gift } = await supabase
                .from("bridal_shower_gifts")
                .select("item_name")
                .eq("id", id)
                .single();

            await supabase.from("bridal_shower_gifts")
                .update({
                    status: "comprado",
                    reserved_by: name,
                    reserved_at: new Date().toISOString()
                })
                .eq("id", id);

            // Create notification
            if (gift) {
                await supabase.from("notifications").insert({
                    type: "gift",
                    title: "Novo Presente Reservado! 🎁",
                    message: `${name} reservou o presente "${gift.item_name}" no Chá de Casa Nova.`,
                    link: "/bridal-shower"
                });

                const verses = [
                    "Nós amamos porque ele nos amou primeiro. (1 João 4:19)",
                    "O meu mandamento é este: amem-se uns aos outros como eu os amei. (João 15:12)",
                    "Acima de tudo, porém, revistam-se do amor, que é o elo perfeito. (Colossenses 3:14)",
                    "Quem não ama não conhece a Deus, porque Deus é amor. (1 João 4:8)",
                    "Assim, permanecem agora estes três: a fé, a esperança e o amor. O maior deles, porém, é o amor. (1 Coríntios 13:13)",
                    "Com amor eterno eu te amei. (Jeremias 31:3)",
                    "O amor é paciente, o amor é bondoso. (1 Coríntios 13:4)",
                    "Tudo o que fizerem, façam com amor. (1 Coríntios 16:14)"
                ];
                const randomVerse = verses[Math.floor(Math.random() * verses.length)];

                return { success: true, giftName: gift.item_name, guestName: name, verse: randomVerse };
            }
        }
    }

    return null;
};

export default function PublicBridalShower() {
    const { gifts, config } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [selectedGift, setSelectedGift] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        if (actionData?.success) {
            setShowSuccessModal(true);
            setSelectedGift(null);
        }
    }, [actionData]);

    const availableGifts = gifts.filter((g: any) => g.status !== 'comprado');
    const reservedGifts = gifts.filter((g: any) => g.status === 'comprado');

    const filteredGifts = availableGifts.filter((g: any) =>
        g.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-rose-50/30 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b py-4 px-4 text-center shadow-sm transition-all">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-serif text-primary mb-1">Gabriel & Raabe</h1>
                    <p className="text-sm text-muted-foreground font-medium">Chá de Casa Nova ❤️</p>

                    {(config?.bridal_shower_date || config?.bridal_shower_location) && (
                        <div className="flex flex-wrap justify-center items-center gap-2 mt-3 text-xs text-primary font-medium">
                            {config.bridal_shower_date && (
                                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(config.bridal_shower_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                            )}
                            {config.bridal_shower_location && (
                                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                                    <MapPin className="h-3 w-3" />
                                    {config.bridal_shower_location}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 space-y-8 pt-6">
                {/* Palette Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 text-center space-y-3">
                    <h2 className="text-lg font-medium text-stone-800">Paleta de Cores dos Presentes</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Para mantermos a harmonia da nossa nova casinha, pedimos com carinho que os presentes sejam na paleta:
                    </p>
                    <div className="flex justify-center items-center gap-4 mt-2">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-12 rounded-full bg-black border-2 border-stone-200 shadow-sm"></div>
                            <span className="text-xs font-medium text-stone-600">Preto</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-12 rounded-full bg-white border-2 border-stone-200 shadow-sm"></div>
                            <span className="text-xs font-medium text-stone-600">Branco</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-12 rounded-full bg-stone-400 border-2 border-stone-200 shadow-sm"></div>
                            <span className="text-xs font-medium text-stone-600">Cinza</span>
                        </div>
                    </div>
                </div>

                {/* Lista de Presentes Disponíveis */}
                <section>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <h2 className="text-xl font-medium flex items-center gap-2">
                            <Gift className="h-5 w-5 text-primary" /> Presentes Disponíveis
                        </h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar presente..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredGifts.length === 0 ? (
                            <p className="col-span-full text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed">
                                {searchTerm ? "Nenhum presente encontrado com esse nome." : "Oba! Todos os presentes já foram reservados ou a lista ainda não foi criada."}
                            </p>
                        ) : (
                            filteredGifts.map((gift: any) => (
                                <Card key={gift.id} className="overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-lg leading-tight">{gift.item_name}</h3>
                                            <Heart className="h-4 w-4 text-rose-300 shrink-0" />
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {gift.suggested_store && <Badge variant="secondary" className="text-xs font-normal">{gift.suggested_store}</Badge>}
                                            {gift.price_range && <Badge variant="outline" className="text-xs font-normal">{gift.price_range}</Badge>}
                                        </div>

                                        <div className="flex flex-col gap-2 mt-4">
                                            {gift.link && (
                                                <a
                                                    href={gift.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    <LinkIcon className="h-3 w-3" /> Ver sugestão na loja <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}

                                            <Button
                                                className="w-full mt-2"
                                                onClick={() => setSelectedGift(gift)}
                                            >
                                                Vou Presentear! 🎁
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* Lista de Presentes Já Reservados */}
                {reservedGifts.length > 0 && (
                    <section className="opacity-70 pt-8 border-t">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-muted-foreground">
                            <Check className="h-5 w-5" /> Já Reservados ({reservedGifts.length})
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {reservedGifts.map((gift: any) => (
                                <div key={gift.id} className="p-3 bg-muted/30 border rounded-lg flex justify-between items-center">
                                    <span className="font-medium line-through text-muted-foreground text-sm">{gift.item_name}</span>
                                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                                        {gift.reserved_by?.split(' ')[0]}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Modal de Confirmação */}
            <Dialog open={!!selectedGift} onOpenChange={(open) => !open && setSelectedGift(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Presente</DialogTitle>
                        <DialogDescription>
                            Que legal! Você escolheu presentear com: <strong>{selectedGift?.item_name}</strong>.
                            Por favor, informe seu nome para marcarmos como reservado.
                        </DialogDescription>
                    </DialogHeader>

                    <Form method="post">
                        <input type="hidden" name="id" value={selectedGift?.id} />
                        <div className="py-4">
                            <Input name="name" placeholder="Seu Nome Completo" required autoFocus />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setSelectedGift(null)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="reserve_gift" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...
                                    </>
                                ) : (
                                    "Confirmar Reserva"
                                )}
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal de Sucesso */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md text-center">
                    <div className="flex justify-center my-4">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <PartyPopper className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">Obrigado, {actionData?.guestName}! ❤️</DialogTitle>
                        <DialogDescription className="text-center text-base pt-2">
                            Sua reserva do presente <strong>{actionData?.giftName}</strong> foi confirmada com sucesso.
                            <br /><br />
                            <span className="italic text-muted-foreground block mt-2">"{actionData?.verse}"</span>
                            <br />
                            Ficamos muito felizes com seu carinho!
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
