import { useState } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, Calendar, Link as LinkIcon, ExternalLink, X, Upload, MoreVertical, Edit, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { Route } from "./+types/bridal-shower";
import { StatsDashboard } from "@/components/bridal-shower/stats-dashboard";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { GIFT_CATEGORIES } from "@/components/bridal-shower/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    useGifts,
    useGuests,
    useBridalConfig,
    useAddGift,
    useUpdateGift,
    useDeleteGift,
    useToggleGiftStatus,
    useBulkUpdateCategory,
    useAddGuest,
    useDeleteGuest,
    useToggleGuestConfirm,
    useUpdateConfig,
    useImportGifts,
    useImportGuests
} from "@/hooks/useBridalShower";
import type { Gift } from "@/schemas/bridal-shower";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Chá de Casa Nova - Admin" }];
};

export default function BridalShower() {
    const { data: gifts = [] } = useGifts();
    const { data: guests = [] } = useGuests();
    const { data: config } = useBridalConfig();

    // Mutations
    const { mutate: addGift } = useAddGift();
    const { mutate: updateGift } = useUpdateGift();
    const { mutate: deleteGift } = useDeleteGift();
    const { mutate: toggleGiftStatus } = useToggleGiftStatus();
    const { mutate: bulkUpdateCategory } = useBulkUpdateCategory();
    const { mutate: addGuest } = useAddGuest();
    const { mutate: deleteGuest } = useDeleteGuest();
    const { mutate: toggleGuestConfirm } = useToggleGuestConfirm();
    const { mutate: updateConfig, isPending: isUpdatingConfig } = useUpdateConfig();
    const { mutate: importGifts, isPending: isImportingGifts } = useImportGifts();
    const { mutate: importGuests, isPending: isImportingGuests } = useImportGuests();

    const defaultDate = config?.bridal_shower_date
        ? new Date(config.bridal_shower_date).toISOString().slice(0, 16)
        : "";

    const [showQrCode, setShowQrCode] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showAddGift, setShowAddGift] = useState(false);
    const [showEditGift, setShowEditGift] = useState(false);
    const [editingGift, setEditingGift] = useState<Gift | null>(null);
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

    // Import Text State
    const [importGiftsText, setImportGiftsText] = useState("");
    const [importGuestsText, setImportGuestsText] = useState("");

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

    const handleEditGift = (gift: Gift) => {
        setEditingGift(gift);
        setEditCategory(gift.category || "");
        setShowEditGift(true);
    };

    // Form Handlers
    const handleConfigSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!config) return;
        const formData = new FormData(e.currentTarget);
        updateConfig({
            id: config.id,
            updates: {
                date: formData.get("date") as string,
                location: formData.get("location") as string
            }
        });
    };

    const handleAddGiftSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        addGift({
            item_name: formData.get("item_name") as string,
            category: formData.get("category") as string,
            suggested_store: formData.get("suggested_store") as string,
            price_range: formData.get("price_range") as string,
            link: formData.get("link") as string,
            image_url: formData.get("image_url") as string
        }, {
            onSuccess: () => setShowAddGift(false)
        });
    };

    const handleUpdateGiftSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingGift) return;
        const formData = new FormData(e.currentTarget);
        updateGift({
            id: editingGift.id,
            item_name: formData.get("item_name") as string,
            category: editCategory, // Use state for select
            suggested_store: formData.get("suggested_store") as string,
            price_range: formData.get("price_range") as string,
            link: formData.get("link") as string,
            image_url: formData.get("image_url") as string
        }, {
            onSuccess: () => setShowEditGift(false)
        });
    };

    const handleBulkCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGifts.length === 0 || !bulkCategory) return;
        bulkUpdateCategory({ ids: selectedGifts, category: bulkCategory }, {
            onSuccess: () => {
                setShowBulkCategory(false);
                setSelectedGifts([]);
            }
        });
    };

    const handleAddGuestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        addGuest({
            name: formData.get("name") as string,
            phone: formData.get("phone") as string
        }, {
            onSuccess: () => setShowAddGuest(false)
        });
    };

    const handleImportGiftsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importGiftsText) return;
        importGifts(importGiftsText, {
            onSuccess: () => {
                setShowImport(false);
                setImportGiftsText("");
            }
        });
    };

    const handleImportGuestsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importGuestsText) return;
        importGuests(importGuestsText, {
            onSuccess: () => {
                setShowImportGuests(false);
                setImportGuestsText("");
            }
        });
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
                    <form onSubmit={handleConfigSubmit} className="space-y-3">
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
                        <Button type="submit" size="sm" variant="outline" className="w-full mt-2" disabled={isUpdatingConfig}>
                            {isUpdatingConfig ? "Salvando..." : "Salvar Detalhes"}
                        </Button>
                    </form>
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
                                                    <button
                                                        onClick={() => toggleGiftStatus({ id: gift.id, currentStatus: gift.status })}
                                                        className="w-full flex items-center px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                    >
                                                        {gift.status === 'comprado' ? (
                                                            <><X className="mr-2 h-4 w-4" /> Marcar Disponível</>
                                                        ) : (
                                                            <><Check className="mr-2 h-4 w-4" /> Marcar Comprado</>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteGift(gift.id)}
                                                        className="w-full flex items-center px-2 py-1.5 text-sm text-red-600 outline-none hover:bg-red-50 cursor-pointer"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                    </button>
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
                                        <Button
                                            onClick={() => toggleGuestConfirm({ id: guest.id, current: guest.confirmed })}
                                            variant={guest.confirmed ? "default" : "outline"}
                                            size="sm"
                                            className={`h-8 px-2 text-xs ${guest.confirmed ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                        >
                                            {guest.confirmed ? "Confirmado" : "Confirmar"}
                                        </Button>
                                        <Button
                                            onClick={() => deleteGuest(guest.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
                    <form onSubmit={handleAddGiftSubmit} className="space-y-3">
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
                            <Button type="submit">Adicionar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Editar Presente */}
            <Dialog open={showEditGift} onOpenChange={setShowEditGift}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Presente</DialogTitle>
                    </DialogHeader>
                    {editingGift && (
                        <form onSubmit={handleUpdateGiftSubmit} className="space-y-3">
                            <Input name="item_name" defaultValue={editingGift.item_name} placeholder="Nome do Item" required />

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
                                <Button type="submit">Salvar Alterações</Button>
                            </DialogFooter>
                        </form>
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
                    <form onSubmit={handleBulkCategorySubmit}>
                        <div className="py-4">
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
                            <Button type="submit">Atualizar</Button>
                        </DialogFooter>
                    </form>
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
                    <form onSubmit={handleAddGuestSubmit} className="space-y-3">
                        <Input name="name" placeholder="Nome" required />
                        <Input name="phone" placeholder="Telefone (Opcional)" />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddGuest(false)}>Cancelar</Button>
                            <Button type="submit">Adicionar</Button>
                        </DialogFooter>
                    </form>
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
                    <form onSubmit={handleImportGiftsSubmit}>
                        <div className="py-4">
                            <textarea
                                value={importGiftsText}
                                onChange={(e) => setImportGiftsText(e.target.value)}
                                className="w-full h-48 p-3 text-sm border rounded-md font-mono"
                                placeholder="Exemplo:&#10;Liquidificador | Magalu | 150&#10;Jogo de Panelas | Tramontina&#10;Toalha de Banho"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowImport(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isImportingGifts}>
                                {isImportingGifts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar Lista"}
                            </Button>
                        </DialogFooter>
                    </form>
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
                    <form onSubmit={handleImportGuestsSubmit}>
                        <div className="py-4">
                            <textarea
                                value={importGuestsText}
                                onChange={(e) => setImportGuestsText(e.target.value)}
                                className="w-full h-48 p-3 text-sm border rounded-md font-mono"
                                placeholder="Exemplo:&#10;João Silva&#10;Maria Souza | 11999999999&#10;Pedro"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowImportGuests(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isImportingGuests}>
                                {isImportingGuests ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar Lista"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
