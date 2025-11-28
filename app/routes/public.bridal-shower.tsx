import { useState } from "react";
import { useLoaderData, Form } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Gift, MapPin, Calendar, Link as LinkIcon, ExternalLink, Check, Heart } from "lucide-react";
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
            await supabase.from("bridal_shower_gifts")
                .update({
                    status: "comprado",
                    reserved_by: name,
                    reserved_at: new Date().toISOString()
                })
                .eq("id", id);
        }
    }

    return null;
};

export default function PublicBridalShower() {
    const { gifts, config } = useLoaderData<typeof loader>();
    const [selectedGift, setSelectedGift] = useState<any>(null);

    const availableGifts = gifts.filter((g: any) => g.status !== 'comprado');
    const reservedGifts = gifts.filter((g: any) => g.status === 'comprado');

    return (
        <div className="min-h-screen bg-rose-50/30 font-sans">
            {/* Header */}
            <header className="bg-white border-b py-6 px-4 text-center shadow-sm">
                <h1 className="text-3xl font-serif text-primary mb-2">Chá de Casa Nova</h1>
                <p className="text-muted-foreground">Ajude-nos a montar nosso lar! ❤️</p>

                {(config?.bridal_shower_date || config?.bridal_shower_location) && (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4 text-sm text-primary font-medium">
                        {config.bridal_shower_date && (
                            <div className="flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full">
                                <Calendar className="h-4 w-4" />
                                {new Date(config.bridal_shower_date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                            </div>
                        )}
                        {config.bridal_shower_location && (
                            <div className="flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full">
                                <MapPin className="h-4 w-4" />
                                {config.bridal_shower_location}
                            </div>
                        )}
                    </div>
                )}
            </header>

            <main className="max-w-3xl mx-auto p-4 space-y-8">
                {/* Lista de Presentes Disponíveis */}
                <section>
                    <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" /> Presentes Disponíveis
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {availableGifts.length === 0 ? (
                            <p className="col-span-full text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed">
                                Oba! Todos os presentes já foram reservados ou a lista ainda não foi criada.
                            </p>
                        ) : (
                            availableGifts.map((gift: any) => (
                                <Card key={gift.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-lg">{gift.item_name}</h3>
                                            <Heart className="h-4 w-4 text-rose-300" />
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {gift.suggested_store && <Badge variant="secondary" className="text-xs">{gift.suggested_store}</Badge>}
                                            {gift.price_range && <Badge variant="outline" className="text-xs">{gift.price_range}</Badge>}
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
                    <section className="opacity-70">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-muted-foreground">
                            <Check className="h-5 w-5" /> Já Reservados
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {reservedGifts.map((gift: any) => (
                                <div key={gift.id} className="p-3 bg-muted/30 border rounded-lg flex justify-between items-center">
                                    <span className="font-medium line-through text-muted-foreground">{gift.item_name}</span>
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        Reservado por {gift.reserved_by?.split(' ')[0]}
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

                    <Form method="post" onSubmit={() => setTimeout(() => setSelectedGift(null), 500)}>
                        <input type="hidden" name="id" value={selectedGift?.id} />
                        <div className="py-4">
                            <Input name="name" placeholder="Seu Nome Completo" required autoFocus />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setSelectedGift(null)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="reserve_gift">Confirmar Reserva</Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
