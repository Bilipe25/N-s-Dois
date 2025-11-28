import { useState } from "react";
import QRCode from "react-qr-code";
import { useLoaderData, Form, useActionData } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Gift, Users, Check, Trash2, MapPin, Calendar, Link as LinkIcon, ExternalLink, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Route } from "./+types/bridal-shower";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Chá de Casa Nova - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);

    const [guestsResult, giftsResult, configResult] = await Promise.all([
        supabase.from("bridal_shower_guests").select("*").order("name"),
        supabase.from("bridal_shower_gifts").select("*").order("item_name"),
        supabase.from("app_config").select("bridal_shower_date, bridal_shower_location").single()
    ]);

    return {
        guests: guestsResult.data || [],
        gifts: giftsResult.data || [],
        config: configResult.data
    };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "update_config") {
        const date = formData.get("date") as string;
        const location = formData.get("location") as string;

        // Precisamos garantir que existe um ID na app_config, pegamos o primeiro
        const { data: config } = await supabase.from("app_config").select("id").single();
        if (config) {
            await supabase.from("app_config").update({
                bridal_shower_date: date || null,
                bridal_shower_location: location
            }).eq("id", config.id);
        }
    } else if (intent === "add_guest") {
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        if (name) {
            await supabase.from("bridal_shower_guests").insert({ name, phone });
        }
    } else if (intent === "delete_guest") {
        const id = formData.get("id") as string;
        await supabase.from("bridal_shower_guests").delete().eq("id", id);
    } else if (intent === "toggle_guest_confirm") {
        const id = formData.get("id") as string;
        const current = formData.get("current") === "true";
        await supabase.from("bridal_shower_guests").update({ confirmed: !current }).eq("id", id);
    } else if (intent === "add_gift") {
        const item_name = formData.get("item_name") as string;
        const suggested_store = formData.get("suggested_store") as string;
        const link = formData.get("link") as string;
        const price_range = formData.get("price_range") as string;

        if (item_name) {
            await supabase.from("bridal_shower_gifts").insert({
                item_name,
                suggested_store,
                link,
                price_range
            });
        }
    } else if (intent === "delete_gift") {
        const id = formData.get("id") as string;
        await supabase.from("bridal_shower_gifts").delete().eq("id", id);
    } else if (intent === "toggle_gift_status") {
        const id = formData.get("id") as string;
        const currentStatus = formData.get("currentStatus") as string;
        const newStatus = currentStatus === 'comprado' ? 'disponivel' : 'comprado';
        await supabase.from("bridal_shower_gifts").update({ status: newStatus }).eq("id", id);
    } else if (intent === "import_gifts") {
        const importText = formData.get("import_text") as string;
        if (importText) {
            const lines = importText.split('\n');
            const giftsToInsert = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                // Tenta dividir por | ou - ou ;
                // Prioridade: | > ; > - (hífen é perigoso pois pode estar no nome)
                let parts = [];
                if (trimmedLine.includes('|')) {
                    parts = trimmedLine.split('|');
                } else if (trimmedLine.includes(';')) {
                    parts = trimmedLine.split(';');
                } else {
                    // Se não tiver separador claro, assume que é tudo nome
                    parts = [trimmedLine];
                }

                const item_name = parts[0]?.trim();
                const suggested_store = parts[1]?.trim() || null;
                const price_range = parts[2]?.trim() || null;

                if (item_name) {
                    giftsToInsert.push({
                        item_name,
                        suggested_store,
                        price_range,
                        status: 'disponivel'
                    });
                }
            }

            if (giftsToInsert.length > 0) {
                await supabase.from("bridal_shower_gifts").insert(giftsToInsert);
            }
        }
    }

    return null;
};

export default function BridalShower() {
    const { guests, gifts, config } = useLoaderData<typeof loader>();

    // Formatar data para input
    const defaultDate = config?.bridal_shower_date
        ? new Date(config.bridal_shower_date).toISOString().slice(0, 16)
        : "";

    const confirmedCount = guests.filter((g: any) => g.confirmed).length;
    const boughtGiftsCount = gifts.filter((g: any) => g.status === 'comprado').length;

    const [showQrCode, setShowQrCode] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/public/bridal-shower` : "";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        alert("Link copiado!");
    };

    return (
        <div className="space-y-6">


            {/* Compartilhamento */}
            <Card className="bg-gradient-to-r from-rose-50 to-white border-rose-100">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm text-rose-500">
                            <Gift className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-medium text-rose-900">Lista de Presentes Pública</h3>
                            <p className="text-sm text-rose-600">Compartilhe este link com seus convidados</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex-1 sm:flex-none bg-white hover:bg-rose-50 border-rose-200 text-rose-700">
                            <LinkIcon className="h-4 w-4 mr-2" /> Copiar Link
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowQrCode(!showQrCode)} className="flex-1 sm:flex-none bg-white hover:bg-rose-50 border-rose-200 text-rose-700">
                            <ExternalLink className="h-4 w-4 mr-2" /> QR Code
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showQrCode && (
                <Card className="bg-white p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 border-2 border-rose-100 shadow-lg max-w-sm mx-auto relative">
                    <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setShowQrCode(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="text-center space-y-1">
                        <h3 className="font-serif text-xl text-primary">Escaneie para acessar</h3>
                        <p className="text-sm text-muted-foreground">Aponte a câmera do celular</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border shadow-sm">
                        <QRCode
                            value={publicUrl}
                            size={200}
                            viewBox={`0 0 256 256`}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                        Este QR Code leva diretamente para a sua lista de presentes pública.
                    </p>
                </Card>
            )}

            {/* Resumo / Configuração Rápida */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 space-y-4">
                    <Form method="post" className="space-y-3">
                        <div className="flex items-center gap-2 text-primary font-medium">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">Data e Hora</span>
                        </div>
                        <Input
                            type="datetime-local"
                            name="date"
                            defaultValue={defaultDate}
                            className="bg-background h-9 text-sm"
                        />

                        <div className="flex items-center gap-2 text-primary font-medium mt-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">Local</span>
                        </div>
                        <Input
                            name="location"
                            defaultValue={config?.bridal_shower_location || ""}
                            placeholder="Ex: Salão de Festas..."
                            className="bg-background h-9 text-sm"
                        />

                        <Button type="submit" name="intent" value="update_config" size="sm" variant="outline" className="w-full">
                            Salvar Detalhes do Evento
                        </Button>
                    </Form>
                </CardContent>
            </Card>

            <Tabs defaultValue="guests" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="guests" className="flex gap-2">
                        <Users className="h-4 w-4" /> Convidados ({confirmedCount}/{guests.length})
                    </TabsTrigger>
                    <TabsTrigger value="gifts" className="flex gap-2">
                        <Gift className="h-4 w-4" /> Presentes ({boughtGiftsCount}/{gifts.length})
                    </TabsTrigger>
                </TabsList>

                {/* Aba de Convidados */}
                <TabsContent value="guests" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Adicionar Convidado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form method="post" className="flex gap-2">
                                <div className="grid gap-2 flex-1">
                                    <Input name="name" placeholder="Nome" required className="h-9" />
                                    <Input name="phone" placeholder="Telefone (Opcional)" className="h-9" />
                                </div>
                                <Button type="submit" name="intent" value="add_guest" size="icon" className="h-auto">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        {guests.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">Nenhum convidado ainda.</p>
                        ) : (
                            guests.map((guest: any) => (
                                <div key={guest.id} className="flex justify-between items-center p-3 bg-card border rounded-lg shadow-sm">
                                    <div>
                                        <p className="font-medium text-sm">{guest.name}</p>
                                        {guest.phone && <p className="text-xs text-muted-foreground">{guest.phone}</p>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Form method="post">
                                            <input type="hidden" name="id" value={guest.id} />
                                            <input type="hidden" name="current" value={String(guest.confirmed)} />
                                            <Button
                                                type="submit"
                                                name="intent"
                                                value="toggle_guest_confirm"
                                                variant={guest.confirmed ? "default" : "outline"}
                                                size="sm"
                                                className={`h-8 px-2 text-xs ${guest.confirmed ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                            >
                                                {guest.confirmed ? "Confirmado" : "Confirmar"}
                                            </Button>
                                        </Form>
                                        <Form method="post">
                                            <input type="hidden" name="id" value={guest.id} />
                                            <Button type="submit" name="intent" value="delete_guest" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </Form>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Aba de Presentes */}
                <TabsContent value="gifts" className="space-y-4 mt-4">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="text-xs">
                            <Plus className="mr-1 h-3 w-3" /> Importar em Massa
                        </Button>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Adicionar Presente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form method="post" className="space-y-3">
                                <Input name="item_name" placeholder="Nome do Item (ex: Liquidificador)" required />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input name="suggested_store" placeholder="Loja (Opcional)" />
                                    <Input name="price_range" placeholder="Preço (ex: R$ 100)" />
                                </div>
                                <Input name="link" placeholder="Link do Produto (http://...)" />
                                <Button type="submit" name="intent" value="add_gift" className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar à Lista
                                </Button>
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        {gifts.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">Lista vazia.</p>
                        ) : (
                            gifts.map((gift: any) => (
                                <div key={gift.id} className={`p-3 border rounded-lg flex flex-col gap-2 ${gift.status === 'comprado' ? 'bg-green-50/50 border-green-200' : 'bg-card shadow-sm'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`font-medium ${gift.status === 'comprado' ? 'text-green-800' : ''}`}>
                                                {gift.item_name}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {gift.suggested_store && <Badge variant="secondary" className="text-[10px]">{gift.suggested_store}</Badge>}
                                                {gift.price_range && <Badge variant="outline" className="text-[10px]">{gift.price_range}</Badge>}
                                            </div>
                                            {gift.reserved_by && (
                                                <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                                                    <Check className="h-3 w-3" /> Reservado por {gift.reserved_by}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Form method="post">
                                                <input type="hidden" name="id" value={gift.id} />
                                                <input type="hidden" name="currentStatus" value={gift.status} />
                                                <Button type="submit" name="intent" value="toggle_gift_status" variant="ghost" size="icon" className={`h-8 w-8 ${gift.status === 'comprado' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </Form>
                                            <Form method="post">
                                                <input type="hidden" name="id" value={gift.id} />
                                                <Button type="submit" name="intent" value="delete_gift" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </Form>
                                        </div>
                                    </div>

                                    {gift.link && (
                                        <a
                                            href={gift.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                        >
                                            <LinkIcon className="h-3 w-3" /> Ver na loja <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal de Importação em Massa */}
            <Dialog open={showImport} onOpenChange={setShowImport}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Presentes em Massa</DialogTitle>
                        <DialogDescription>
                            Cole sua lista abaixo. Cada linha será um presente.<br />
                            Formato: <code>Nome | Loja | Preço</code>
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" onSubmit={() => setShowImport(false)}>
                        <div className="py-4">
                            <textarea
                                name="import_text"
                                className="w-full h-48 p-3 text-sm border rounded-md font-mono"
                                placeholder="Exemplo:&#10;Liquidificador | Magalu | 150&#10;Jogo de Panelas | Tramontina&#10;Toalha de Banho"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowImport(false)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="import_gifts">Importar Lista</Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
