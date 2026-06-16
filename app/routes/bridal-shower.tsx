import { useState } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link as LinkIcon, ExternalLink, X, Upload, MoreVertical, Edit, Check, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Route } from "./+types/bridal-shower";
import { StatsDashboard } from "@/components/bridal-shower/stats-dashboard";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { GIFT_CATEGORIES, type GiftCategory, type Gift } from "@/schemas/bridal-shower";
import { toast } from "sonner";

import {
    useGifts,
    useGuests,
    useBridalConfig,
    useCreateGift,
    useUpdateGift,
    useDeleteGift,
    useToggleGiftStatus,
    useBulkUpdateCategory,
    useCreateGuest,
    useDeleteGuest,
    useToggleGuestConfirm,
    useUpdateConfig,
    useImportGifts,
    useImportGuests,
    useMainGuests,
    useImportGuestsFromMain
} from "@/hooks/useBridalShower";

// Extracted Components
import { AdminConfigForm } from "@/components/bridal-shower/admin-config-form";
import { AdminAddGiftDrawer } from "@/components/bridal-shower/admin-add-gift-drawer";
import { AdminEditGiftDrawer } from "@/components/bridal-shower/admin-edit-gift-drawer";
import { AdminGiftDetailsDrawer } from "@/components/bridal-shower/admin-gift-details-drawer";
import { AdminAddGuestDrawer } from "@/components/bridal-shower/admin-add-guest-drawer";
import { AdminImportFromMainDrawer } from "@/components/bridal-shower/admin-import-from-main-drawer";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Chá de Casa Nova - Admin" }];
};

export default function BridalShower() {
    const { data: gifts = [] } = useGifts();
    const { data: guests = [] } = useGuests();
    const { data: config } = useBridalConfig();
    const { data: mainGuests = [], isLoading: isLoadingMainGuests } = useMainGuests();

    // Mutations
    const createGift = useCreateGift();
    const updateGift = useUpdateGift();
    const deleteGift = useDeleteGift();
    const toggleGiftStatus = useToggleGiftStatus();
    const bulkUpdateCategory = useBulkUpdateCategory();
    const createGuest = useCreateGuest();
    const deleteGuest = useDeleteGuest();
    const toggleGuestConfirm = useToggleGuestConfirm();
    const updateConfig = useUpdateConfig();
    const importGifts = useImportGifts();
    const importGuests = useImportGuests();
    const importGuestsFromMain = useImportGuestsFromMain();

    const [showQrCode, setShowQrCode] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showAddGift, setShowAddGift] = useState(false);
    const [showEditGift, setShowEditGift] = useState(false);
    const [editingGift, setEditingGift] = useState<Gift | null>(null);
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [showImportGuests, setShowImportGuests] = useState(false);
    const [showImportFromMain, setShowImportFromMain] = useState(false);

    // Filters & Selection
    const [giftSearch, setGiftSearch] = useState("");
    const [giftCategory, setGiftCategory] = useState<GiftCategory | null>(null);
    const [giftStatus, setGiftStatus] = useState<"all" | "disponivel" | "comprado">("all");
    const [guestSearch, setGuestSearch] = useState("");
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [showBulkCategory, setShowBulkCategory] = useState(false);
    const [bulkCategory, setBulkCategory] = useState<GiftCategory | "">("");
    const [selectedGiftDetails, setSelectedGiftDetails] = useState<Gift | null>(null);

    // Import Text State
    const [importGiftsText, setImportGiftsText] = useState("");
    const [importGuestsText, setImportGuestsText] = useState("");

    const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/public/bridal-shower` : "";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        toast.success("Link público copiado para a área de transferência!");
    };

    const filteredGifts = gifts.filter((g) => {
        const matchesSearch = g.item_name.toLowerCase().includes(giftSearch.toLowerCase()) ||
            (g.suggested_store && g.suggested_store.toLowerCase().includes(giftSearch.toLowerCase()));
        const matchesCategory = giftCategory ? g.category === giftCategory : true;
        const matchesStatus = giftStatus === "all" ? true : g.status === giftStatus;
        return matchesSearch && matchesCategory && matchesStatus;
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
        setShowEditGift(true);
    };

    const handleBulkCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGifts.length === 0 || !bulkCategory) return;
        bulkUpdateCategory.mutate({ ids: selectedGifts, category: bulkCategory }, {
            onSuccess: () => {
                setShowBulkCategory(false);
                setSelectedGifts([]);
                toast.success("Categorias atualizadas com sucesso!");
            }
        });
    };

    const handleImportGiftsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importGiftsText) return;
        importGifts.mutate(importGiftsText, {
            onSuccess: () => {
                setShowImport(false);
                setImportGiftsText("");
                toast.success("Presentes importados com sucesso!");
            }
        });
    };

    const handleImportGuestsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importGuestsText) return;
        importGuests.mutate(importGuestsText, {
            onSuccess: () => {
                setShowImportGuests(false);
                setImportGuestsText("");
                toast.success("Convidados importados com sucesso!");
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
            <AdminConfigForm config={config} updateConfig={updateConfig} />

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
                        onCategorySelect={setGiftCategory as any}
                        selectedStatus={giftStatus}
                        onStatusSelect={setGiftStatus}
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
                                <div
                                    key={gift.id}
                                    className={`p-3 border rounded-lg flex gap-3 items-start cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${gift.status === 'comprado' ? 'bg-green-50/50 border-green-200' : 'bg-white shadow-sm hover:border-stone-300'}`}
                                    onClick={() => setSelectedGiftDetails(gift)}
                                >
                                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
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

                                            <div onClick={(e) => e.stopPropagation()}>
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
                                                            onClick={() => toggleGiftStatus.mutate({ id: gift.id, currentStatus: gift.status })}
                                                            className="w-full flex items-center px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                        >
                                                            {gift.status === 'comprado' ? (
                                                                <><X className="mr-2 h-4 w-4" /> Marcar Disponível</>
                                                            ) : (
                                                                <><Check className="mr-2 h-4 w-4" /> Marcar Comprado</>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteGift.mutate(gift.id)}
                                                            className="w-full flex items-center px-2 py-1.5 text-sm text-red-600 outline-none hover:bg-red-50 cursor-pointer"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </button>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        {gift.link && (
                                            <a href={gift.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                                                <ExternalLink className="h-3 w-3" /> Link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {!selectedGiftDetails && (
                        <div className="fixed bottom-safe-24 right-6 z-40 flex flex-col gap-3">
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
                    )}
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
                                            onClick={() => toggleGuestConfirm.mutate({ id: guest.id, current: guest.confirmed })}
                                            variant={guest.confirmed ? "default" : "outline"}
                                            size="sm"
                                            className={`h-8 px-2 text-xs ${guest.confirmed ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                        >
                                            {guest.confirmed ? "Confirmado" : "Confirmar"}
                                        </Button>
                                        <Button
                                            onClick={() => deleteGuest.mutate(guest.id)}
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

                    <div className="fixed bottom-safe-24 right-6 z-50 flex flex-col gap-3">
                        <Button
                            onClick={() => setShowImportFromMain(true)}
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-full shadow-md bg-rose-100 hover:bg-rose-200 text-rose-600"
                            title="Importar da Lista Principal"
                        >
                            <Users className="h-5 w-5" />
                        </Button>
                        <Button
                            onClick={() => setShowImportGuests(true)}
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-full shadow-md"
                            title="Importar Texto"
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

            {/* Modals & Drawers */}
            <AdminAddGiftDrawer open={showAddGift} onOpenChange={setShowAddGift} createGift={createGift} />
            <AdminEditGiftDrawer open={showEditGift} onOpenChange={setShowEditGift} gift={editingGift} updateGift={updateGift} />
            <AdminAddGuestDrawer open={showAddGuest} onOpenChange={setShowAddGuest} createGuest={createGuest} />
            <AdminGiftDetailsDrawer gift={selectedGiftDetails} onClose={() => setSelectedGiftDetails(null)} onEdit={handleEditGift} toggleStatus={toggleGiftStatus} />
            
            <AdminImportFromMainDrawer
                open={showImportFromMain}
                onOpenChange={setShowImportFromMain}
                mainGuests={mainGuests}
                currentGuests={guests}
                isLoadingMainGuests={isLoadingMainGuests}
                importGuestsFromMain={importGuestsFromMain}
            />

            {/* Modal de Importação em Massa de Presentes */}
            <Dialog open={showImport} onOpenChange={setShowImport}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Presentes</DialogTitle>
                        <DialogDescription>
                            Cole uma lista de presentes (um por linha). Se incluir preço ou loja, use vírgula. Ex: <br />
                            Liquidificador, 150, Polishop<br />
                            Faqueiro, Tramontina
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleImportGiftsSubmit}>
                        <div className="py-4">
                            <textarea
                                className="w-full min-h-[150px] p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                                placeholder="Liquidificador&#10;Jogo de pratos, 200&#10;Faqueiro, Tramontina"
                                value={importGiftsText}
                                onChange={(e) => setImportGiftsText(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowImport(false)}>Cancelar</Button>
                            <Button type="submit" disabled={importGifts.isPending}>
                                {importGifts.isPending ? "Importando..." : "Importar Lista"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Importação em Massa de Convidados */}
            <Dialog open={showImportGuests} onOpenChange={setShowImportGuests}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Convidados</DialogTitle>
                        <DialogDescription>
                            Cole uma lista de nomes (um por linha). Ex: <br />
                            João Silva<br />
                            Maria Costa, 11999999999
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleImportGuestsSubmit}>
                        <div className="py-4">
                            <textarea
                                className="w-full min-h-[150px] p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="João Silva&#10;Maria Costa, 11999999999"
                                value={importGuestsText}
                                onChange={(e) => setImportGuestsText(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowImportGuests(false)}>Cancelar</Button>
                            <Button type="submit" disabled={importGuests.isPending} className="bg-rose-500 hover:bg-rose-600">
                                {importGuests.isPending ? "Importando..." : "Importar Lista"}
                            </Button>
                        </DialogFooter>
                    </form>
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
                            <Select value={bulkCategory} onValueChange={setBulkCategory as any} required>
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
        </div>
    );
}
