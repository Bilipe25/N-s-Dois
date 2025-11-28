import { useState } from "react";
import { useLoaderData, Form, useActionData } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Gift, Users, Check, Trash2, MapPin, Calendar, Link as LinkIcon, ExternalLink } from "lucide-react";
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
        const newStatus = currentStatus === "disponivel" ? "comprado" : "disponivel";
        await supabase.from("bridal_shower_gifts").update({ status: newStatus }).eq("id", id);
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

    return (
        <div className="space-y-6">
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
                                <div key={gift.id} className={`p-3 border rounded-lg flex flex-col gap-2 ${gift.status === 'comprado' ? 'bg-muted/50' : 'bg-card shadow-sm'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`font-medium ${gift.status === 'comprado' ? 'line-through text-muted-foreground' : ''}`}>
                                                {gift.item_name}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {gift.suggested_store && <Badge variant="secondary" className="text-[10px]">{gift.suggested_store}</Badge>}
                                                {gift.price_range && <Badge variant="outline" className="text-[10px]">{gift.price_range}</Badge>}
                                            </div>
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
        </div>
    );
}
