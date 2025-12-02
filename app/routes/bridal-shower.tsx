import { useState } from "react";
import QRCode from "react-qr-code";
import { useLoaderData, Form } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, Calendar, Link as LinkIcon, ExternalLink, X, Upload, MoreVertical, Edit, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { Route } from "./+types/bridal-shower";
import { StatsDashboard } from "@/components/bridal-shower/stats-dashboard";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { GIFT_CATEGORIES, type Gift as GiftType, type Guest } from "@/components/bridal-shower/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Chá de Casa Nova - Admin" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);

    const [guestsResult, giftsResult, configResult] = await Promise.all([
        supabase.from("bridal_shower_guests").select("*").order("name"),
        supabase.from("bridal_shower_gifts").select("*").order("item_name"),
        supabase.from("app_config").select("bridal_shower_date, bridal_shower_location").single()
    ]);

    return {
        guests: (guestsResult.data || []) as Guest[],
        gifts: (giftsResult.data || []) as GiftType[],
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
        const category = formData.get("category") as string;
        const image_url = formData.get("image_url") as string;

        if (item_name) {
            await supabase.from("bridal_shower_gifts").insert({
                item_name,
                suggested_store: suggested_store || null,
                link: link || null,
                price_range: price_range || null,
                category: category || null,
                image_url: image_url || null
            });
        }
    } else if (intent === "update_gift") {
        const id = formData.get("id") as string;
        const item_name = formData.get("item_name") as string;
        const suggested_store = formData.get("suggested_store") as string;
        const link = formData.get("link") as string;
        const price_range = formData.get("price_range") as string;
        const category = formData.get("category") as string;
        const image_url = formData.get("image_url") as string;

        if (id && item_name) {
            await supabase.from("bridal_shower_gifts").update({
                item_name,
                suggested_store: suggested_store || null,
                link: link || null,
                price_range: price_range || null,
                category: category || null,
                image_url: image_url || null
            }).eq("id", id);
        }
    } else if (intent === "delete_gift") {
        const id = formData.get("id") as string;
        await supabase.from("bridal_shower_gifts").delete().eq("id", id);
    } else if (intent === "toggle_gift_status") {
        const id = formData.get("id") as string;
        const currentStatus = formData.get("currentStatus") as string;
        const newStatus = currentStatus === 'comprado' ? 'disponivel' : 'comprado';
        await supabase.from("bridal_shower_gifts").update({ status: newStatus }).eq("id", id);
    } else if (intent === "bulk_update_category") {
        const ids = formData.get("ids")?.toString().split(",") || [];
        const category = formData.get("category") as string;

        if (ids.length > 0 && category) {
            await supabase.from("bridal_shower_gifts")
                .update({ category })
                .in("id", ids);
        }
    } else if (intent === "import_gifts") {
        const importText = formData.get("import_text") as string;
        if (importText) {
            const lines = importText.split('\n');
            const giftsToInsert = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                let parts = [];
                if (trimmedLine.includes('|')) {
                    parts = trimmedLine.split('|');
                } else if (trimmedLine.includes(';')) {
                    parts = trimmedLine.split(';');
                } else {
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
    } else if (intent === "import_guests") {
        const importText = formData.get("import_text") as string;
        if (importText) {
            const lines = importText.split('\n');
            const guestsToInsert = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                let parts = [];
                if (trimmedLine.includes('|')) {
                    parts = trimmedLine.split('|');
                } else if (trimmedLine.includes(';')) {
                    parts = trimmedLine.split(';');
                } else {
                    parts = [trimmedLine];
                }

                const name = parts[0]?.trim();
                const phone = parts[1]?.trim() || null;

                if (name) {
                    guestsToInsert.push({
                        name,
                        phone,
                        confirmed: false
                    });
                }
            }

            if (guestsToInsert.length > 0) {
                await supabase.from("bridal_shower_guests").insert(guestsToInsert);
            }
        }
    }

    return null;
};

export default function BridalShower() {
    const { guests, gifts, config } = useLoaderData<typeof loader>();

    const defaultDate = config?.bridal_shower_date
        ? new Date(config.bridal_shower_date).toISOString().slice(0, 16)
        : "";

    const [showQrCode, setShowQrCode] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showAddGift, setShowAddGift] = useState(false);
    const [showEditGift, setShowEditGift] = useState(false);
    const [editingGift, setEditingGift] = useState<GiftType | null>(null);
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [showImportGuests, setShowImportGuests] = useState(false);

    // Filters & Selection
    const [giftSearch, setGiftSearch] = useState("");
    const [giftCategory, setGiftCategory] = useState<string | null>(null);
    const [guestSearch, setGuestSearch] = useState("");
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [showBulkCategory, setShowBulkCategory] = useState(false);
    const [bulkCategory, setBulkCategory] = useState<string>("");
    const [editCategory, setEditCategory] = useState<string>("");

    const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/public/bridal-shower` : "";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        alert("Link copiado!");
    };

    const filteredGifts = gifts.filter((g) => {
        const matchesSearch = g.item_name.toLowerCase().includes(giftSearch.toLowerCase()) ||
            (g.suggested_store && g.suggested_store.toLowerCase().includes(giftSearch.toLowerCase()));
        const matchesCategory = giftCategory ? g.category === giftCategory : true;
        return matchesSearch && matchesCategory;
    });

    const filteredGuests = guests.filter((g) =>
        g.name.toLowerCase().includes(guestSearch.toLowerCase())
    );

    const handleSelectGift = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedGifts(prev => [...prev, id]);
        } else {
            setSelectedGifts(prev => prev.filter(gId => gId !== id));
        }
    };

    const handleEditGift = (gift: GiftType) => {
        setEditingGift(gift);
        setEditCategory(gift.category || "");
        setShowEditGift(true);
    };

    return (
        <div className="space-y-6 relative min-h-screen pb-24">
            <StatsDashboard gifts={gifts} guests={guests} />

            {/* Compartilhamento */}
            <Card className="bg-white border-stone-200 shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-50 p-2 rounded-full text-rose-500">
                            <LinkIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-medium text-stone-900">Link Público</h3>
                            <p className="text-xs text-stone-500">Para enviar aos convidados</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex-1 sm:flex-none">
                            Copiar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowQrCode(!showQrCode)} className="flex-1 sm:flex-none">
                            QR Code
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showQrCode && (
                <Card className="bg-white p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 border-2 border-rose-100 shadow-lg max-w-sm mx-auto relative z-50">
                    <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setShowQrCode(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="bg-white p-2 rounded-xl border shadow-sm">
                        <QRCode
                            value={publicUrl}
                            size={200}
                            viewBox={`0 0 256 256`}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                    </div>
                </Card>
            )}

            {/* Configuração Rápida */}
            <Card className="bg-stone-50 border-stone-200">
                <CardContent className="p-4">
                    <Form method="post" className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-stone-600 font-medium text-xs uppercase tracking-wider">
                                    <Calendar className="h-3 w-3" /> Data e Hora
                                </div>
                                <Input
                                    type="datetime-local"
                                    name="date"
                                    defaultValue={defaultDate}
                                    className="bg-white h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-stone-600 font-medium text-xs uppercase tracking-wider">
                                    <MapPin className="h-3 w-3" /> Local
                                </div>
                                <Input
                                    name="location"
                                    defaultValue={config?.bridal_shower_location || ""}
                                    placeholder="Ex: Salão de Festas..."
                                    className="bg-white h-9 text-sm"
                                />
                            </div>
                        </div>
                        <Button type="submit" name="intent" value="update_config" size="sm" variant="outline" className="w-full mt-2">
                            Salvar Detalhes
                        </Button>
                    </Form>
                </CardContent>
            </Card>

            <Tabs defaultValue="gifts" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="gifts">Presentes</TabsTrigger>
                    <TabsTrigger value="guests">Convidados</TabsTrigger>
                </TabsList>

                {/* Aba de Presentes */}
                <TabsContent value="gifts" className="space-y-4 mt-4">
                    <GiftFilter
                        searchTerm={giftSearch}
                        onSearchChange={setGiftSearch}
                        selectedCategory={giftCategory}
                        onCategorySelect={setGiftCategory}
                    />

                    {/* Bulk Actions Bar */}
                    {selectedGifts.length > 0 && (
                        <div className="sticky top-14 z-30 bg-stone-900 text-white p-3 rounded-lg shadow-lg flex items-center justify-between animate-in slide-in-from-bottom-2">
                            <span className="text-sm font-medium pl-2">{selectedGifts.length} selecionados</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setShowBulkCategory(true)}>
                                    Editar Categoria
                                </Button>
                                <Button size="sm" variant="ghost" className="text-stone-300 hover:text-white" onClick={() => setSelectedGifts([])}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {filteredGifts.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                {gifts.length === 0 ? "Lista vazia." : "Nenhum presente encontrado."}
                            </p>
                        ) : (
                            filteredGifts.map((gift) => (
                                <div key={gift.id} className={`p-3 border rounded-lg flex gap-3 items-start ${gift.status === 'comprado' ? 'bg-green-50/50 border-green-200' : 'bg-white shadow-sm'}`}>
                                    <div className="pt-1">
                                        <Checkbox
                                            checked={selectedGifts.includes(gift.id)}
                                            onCheckedChange={(checked) => handleSelectGift(gift.id, checked as boolean)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-medium ${gift.status === 'comprado' ? 'text-green-800' : ''}`}>
                                                    {gift.item_name}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {gift.category && <Badge variant="secondary" className="text-[10px]">{gift.category}</Badge>}
                                                    {gift.suggested_store && <Badge variant="outline" className="text-[10px]">{gift.suggested_store}</Badge>}
                                                    {gift.price_range && <Badge variant="outline" className="text-[10px]">{gift.price_range}</Badge>}
                                                </div>
                                                {gift.reserved_by && (
                                                    <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                                                        <Check className="h-3 w-3" /> Reservado por {gift.reserved_by}
                                                    </p>
                                                )}
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditGift(gift)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <Form method="post">
                                                        <input type="hidden" name="id" value={gift.id} />
                                                        <input type="hidden" name="currentStatus" value={gift.status} />
                                                        <button type="submit" name="intent" value="toggle_gift_status" className="w-full flex items-center px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer">
                                                            {gift.status === 'comprado' ? (
                                                                <><X className="mr-2 h-4 w-4" /> Marcar Disponível</>
                                                            ) : (
                                                                <><Check className="mr-2 h-4 w-4" /> Marcar Comprado</>
                                                            )}
                                                        </button>
                                                    </Form>
                                                    <Form method="post">
                                                        <input type="hidden" name="id" value={gift.id} />
                                                        <button type="submit" name="intent" value="delete_gift" className="w-full flex items-center px-2 py-1.5 text-sm text-red-600 outline-none hover:bg-red-50 cursor-pointer">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </button>
                                                    </Form>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        {gift.link && (
                                            <a href={gift.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                                <ExternalLink className="h-3 w-3" /> Link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3">
                        <Button
                            onClick={() => setShowImport(true)}
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-full shadow-md"
                            title="Importar Presentes"
                        >
                            <Upload className="h-5 w-5" />
                        </Button>
                        <Button
                            onClick={() => setShowAddGift(true)}
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg bg-stone-900 hover:bg-stone-800 text-white"
                        >
                            <Plus className="h-6 w-6" />
                        </Button>
                    </div>
                </TabsContent>

                {/* Aba de Convidados */}
                <TabsContent value="guests" className="space-y-4 mt-4">
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="Buscar convidado..."
                            value={guestSearch}
                            onChange={(e) => setGuestSearch(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        {filteredGuests.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                {guests.length === 0 ? "Nenhum convidado ainda." : "Nenhum convidado encontrado."}
                            </p>
                        ) : (
                            filteredGuests.map((guest) => (
                                <div key={guest.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
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

                    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3">
                        <Button
                            onClick={() => setShowImportGuests(true)}
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-full shadow-md"
                            title="Importar Convidados"
                        >
                            <Upload className="h-5 w-5" />
                        </Button>
                        <Button
                            onClick={() => setShowAddGuest(true)}
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg bg-stone-900 hover:bg-stone-800 text-white"
                        >
                            <Plus className="h-6 w-6" />
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal de Adicionar Presente */}
            <Dialog open={showAddGift} onOpenChange={setShowAddGift}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Presente</DialogTitle>
                        <DialogDescription>
                            Adicione um novo item à sua lista de presentes.
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" className="space-y-3" onSubmit={() => setShowAddGift(false)}>
                        <Input name="item_name" placeholder="Nome do Item (ex: Liquidificador)" required />

                        <Select name="category">
                            <SelectTrigger>
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {GIFT_CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="grid grid-cols-2 gap-2">
                            <Input name="suggested_store" placeholder="Loja (Opcional)" />
                            <Input name="price_range" placeholder="Preço (ex: R$ 100)" />
                        </div>
                        <Input name="link" placeholder="Link do Produto (http://...)" />
                        <Input name="image_url" placeholder="URL da Imagem (Opcional)" />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddGift(false)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="add_gift">
                                Adicionar
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal de Editar Presente */}
            <Dialog open={showEditGift} onOpenChange={setShowEditGift}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Presente</DialogTitle>
                    </DialogHeader>
                    {editingGift && (
                        <Form method="post" className="space-y-3" onSubmit={() => setShowEditGift(false)}>
                            <input type="hidden" name="id" value={editingGift.id} />
                            <Input name="item_name" defaultValue={editingGift.item_name} placeholder="Nome do Item" required />

                            <input type="hidden" name="category" value={editCategory} />
                            <Select value={editCategory} onValueChange={setEditCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GIFT_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="grid grid-cols-2 gap-2">
                                <Input name="suggested_store" defaultValue={editingGift.suggested_store || ""} placeholder="Loja (Opcional)" />
                                <Input name="price_range" defaultValue={editingGift.price_range || ""} placeholder="Preço (ex: R$ 100)" />
                            </div>
                            <Input name="link" defaultValue={editingGift.link || ""} placeholder="Link do Produto" />
                            <Input name="image_url" defaultValue={editingGift.image_url || ""} placeholder="URL da Imagem" />

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setShowEditGift(false)}>Cancelar</Button>
                                <Button type="submit" name="intent" value="update_gift">
                                    Salvar Alterações
                                </Button>
                            </DialogFooter>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Edição em Lote de Categoria */}
            <Dialog open={showBulkCategory} onOpenChange={setShowBulkCategory}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Categoria em Lote</DialogTitle>
                        <DialogDescription>
                            Selecione a nova categoria para os {selectedGifts.length} itens selecionados.
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" onSubmit={() => { setShowBulkCategory(false); setSelectedGifts([]); }}>
                        <input type="hidden" name="ids" value={selectedGifts.join(",")} />
                        <div className="py-4">
                            <input type="hidden" name="category" value={bulkCategory} />
                            <Select value={bulkCategory} onValueChange={setBulkCategory} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GIFT_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowBulkCategory(false)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="bulk_update_category">
                                Atualizar
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal de Adicionar Convidado */}
            <Dialog open={showAddGuest} onOpenChange={setShowAddGuest}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Convidado</DialogTitle>
                        <DialogDescription>
                            Adicione um novo convidado à sua lista.
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" className="space-y-3" onSubmit={() => setShowAddGuest(false)}>
                        <Input name="name" placeholder="Nome" required />
                        <Input name="phone" placeholder="Telefone (Opcional)" />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddGuest(false)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="add_guest">
                                Adicionar
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal de Importação em Massa de Presentes */}
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

            {/* Modal de Importação em Massa de Convidados */}
            <Dialog open={showImportGuests} onOpenChange={setShowImportGuests}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Convidados em Massa</DialogTitle>
                        <DialogDescription>
                            Cole sua lista de nomes abaixo. Cada linha será um convidado.<br />
                            Opcional: <code>Nome | Telefone</code>
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" onSubmit={() => setShowImportGuests(false)}>
                        <div className="py-4">
                            <textarea
                                name="import_text"
                                className="w-full h-48 p-3 text-sm border rounded-md font-mono"
                                placeholder="Exemplo:&#10;João Silva&#10;Maria Souza | 11999999999&#10;Pedro"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowImportGuests(false)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="import_guests">Importar Lista</Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
