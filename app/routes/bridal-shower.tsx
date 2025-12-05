import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, Calendar, Link as LinkIcon, ExternalLink, X, Upload, MoreVertical, Edit, Check, Loader2, Gift as GiftIcon, User, Clock, Tag, Store, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { Route } from "./+types/bridal-shower";
import { StatsDashboard } from "@/components/bridal-shower/stats-dashboard";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { GIFT_CATEGORIES, type GiftCategory, type Gift, type CreateGiftInput, CreateGiftSchema, type UpdateGiftInput, UpdateGiftSchema, type CreateGuestInput, CreateGuestSchema, type UpdateConfigInput, UpdateConfigSchema } from "@/schemas/bridal-shower";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    useImportGuests
} from "@/hooks/useBridalShower";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Chá de Casa Nova - Admin" }];
};

export default function BridalShower() {
    const { data: gifts = [] } = useGifts();
    const { data: guests = [] } = useGuests();
    const { data: config } = useBridalConfig();

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
    const [giftCategory, setGiftCategory] = useState<GiftCategory | null>(null);
    const [guestSearch, setGuestSearch] = useState("");
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [showBulkCategory, setShowBulkCategory] = useState(false);
    const [bulkCategory, setBulkCategory] = useState<GiftCategory | "">("");
    const [editCategory, setEditCategory] = useState<GiftCategory | "">("");
    const [selectedGiftDetails, setSelectedGiftDetails] = useState<Gift | null>(null);

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

    const handleBulkCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGifts.length === 0 || !bulkCategory) return;
        bulkUpdateCategory.mutate({ ids: selectedGifts, category: bulkCategory }, {
            onSuccess: () => {
                setShowBulkCategory(false);
                setSelectedGifts([]);
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
            <ConfigForm config={config} updateConfig={updateConfig} />

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

                    {/* Gift Details Drawer */}
                    <Drawer open={!!selectedGiftDetails} onOpenChange={(open) => !open && setSelectedGiftDetails(null)}>
                        <DrawerContent className="max-h-[90vh]">
                            {selectedGiftDetails && (
                                <>
                                    <DrawerHeader className="text-left border-b pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-xl ${selectedGiftDetails.status === 'comprado' ? 'bg-green-100' : 'bg-stone-100'}`}>
                                                    <GiftIcon className={`h-6 w-6 ${selectedGiftDetails.status === 'comprado' ? 'text-green-600' : 'text-stone-600'}`} />
                                                </div>
                                                <div>
                                                    <DrawerTitle className="text-xl">{selectedGiftDetails.item_name}</DrawerTitle>
                                                    <Badge
                                                        variant={selectedGiftDetails.status === 'comprado' ? 'default' : 'secondary'}
                                                        className={selectedGiftDetails.status === 'comprado' ? 'bg-green-500 mt-1' : 'mt-1'}
                                                    >
                                                        {selectedGiftDetails.status === 'comprado' ? '✓ Reservado' : 'Disponível'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </DrawerHeader>

                                    <div className="px-4 py-4 space-y-4 overflow-y-auto">
                                        {/* Imagem */}
                                        {selectedGiftDetails.image_url && (
                                            <div className="rounded-xl overflow-hidden border bg-stone-50">
                                                <img
                                                    src={selectedGiftDetails.image_url}
                                                    alt={selectedGiftDetails.item_name}
                                                    className="w-full h-48 object-contain"
                                                />
                                            </div>
                                        )}

                                        {/* Informações */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedGiftDetails.category && (
                                                <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                                        <Tag className="h-4 w-4 text-stone-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-stone-400 uppercase tracking-wide">Categoria</p>
                                                        <p className="text-sm font-medium text-stone-700">{selectedGiftDetails.category}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedGiftDetails.price_range && (
                                                <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                                        <DollarSign className="h-4 w-4 text-stone-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-stone-400 uppercase tracking-wide">Faixa de Preço</p>
                                                        <p className="text-sm font-medium text-stone-700">{selectedGiftDetails.price_range}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedGiftDetails.suggested_store && (
                                                <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                                        <Store className="h-4 w-4 text-stone-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-stone-400 uppercase tracking-wide">Loja Sugerida</p>
                                                        <p className="text-sm font-medium text-stone-700">{selectedGiftDetails.suggested_store}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedGiftDetails.reserved_by && (
                                                <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                                        <User className="h-4 w-4 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-green-600 uppercase tracking-wide">Reservado por</p>
                                                        <p className="text-sm font-medium text-green-700">{selectedGiftDetails.reserved_by}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {selectedGiftDetails.reserved_at && (
                                            <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                                    <Clock className="h-4 w-4 text-stone-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-stone-400 uppercase tracking-wide">Data da Reserva</p>
                                                    <p className="text-sm font-medium text-stone-700">
                                                        {new Date(selectedGiftDetails.reserved_at).toLocaleString('pt-BR', {
                                                            dateStyle: 'long',
                                                            timeStyle: 'short'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Link */}
                                        {selectedGiftDetails.link && (
                                            <a
                                                href={selectedGiftDetails.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                                            >
                                                <div className="bg-blue-500 p-2 rounded-lg">
                                                    <ExternalLink className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-blue-700">Ver na Loja</p>
                                                    <p className="text-xs text-blue-500 truncate">{selectedGiftDetails.link}</p>
                                                </div>
                                            </a>
                                        )}
                                    </div>

                                    <DrawerFooter className="border-t pt-4 flex-row gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => {
                                                handleEditGift(selectedGiftDetails);
                                                setSelectedGiftDetails(null);
                                            }}
                                        >
                                            <Edit className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                        <Button
                                            variant={selectedGiftDetails.status === 'comprado' ? 'outline' : 'default'}
                                            className={`flex-1 ${selectedGiftDetails.status !== 'comprado' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                            onClick={() => {
                                                toggleGiftStatus.mutate({ id: selectedGiftDetails.id, currentStatus: selectedGiftDetails.status });
                                                setSelectedGiftDetails(null);
                                            }}
                                        >
                                            {selectedGiftDetails.status === 'comprado' ? (
                                                <><X className="h-4 w-4 mr-2" /> Disponível</>
                                            ) : (
                                                <><Check className="h-4 w-4 mr-2" /> Reservado</>
                                            )}
                                        </Button>
                                    </DrawerFooter>
                                </>
                            )}
                        </DrawerContent>
                    </Drawer>

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

            {/* Modals */}
            <AddGiftDialog open={showAddGift} onOpenChange={setShowAddGift} createGift={createGift} />
            <EditGiftDialog open={showEditGift} onOpenChange={setShowEditGift} gift={editingGift} updateGift={updateGift} />
            <AddGuestDialog open={showAddGuest} onOpenChange={setShowAddGuest} createGuest={createGuest} />

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
                            <Button type="submit" disabled={importGifts.isPending}>
                                {importGifts.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar Lista"}
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
                            <Button type="submit" disabled={importGuests.isPending}>
                                {importGuests.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar Lista"}
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

// --- SUB-COMPONENTS ---

function ConfigForm({ config, updateConfig }: { config: any, updateConfig: any }) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().slice(0, 16);
    };

    const form = useForm<UpdateConfigInput>({
        resolver: zodResolver(UpdateConfigSchema),
        defaultValues: {
            date: formatDate(config?.bridal_shower_date),
            location: config?.bridal_shower_location || "",
            address_1: config?.bridal_shower_address_1 || "",
            map_link_1: config?.bridal_shower_map_link_1 || "",
            date_2: formatDate(config?.bridal_shower_date_2),
            location_2: config?.bridal_shower_location_2 || "",
            address_2: config?.bridal_shower_address_2 || "",
            map_link_2: config?.bridal_shower_map_link_2 || "",
            hero_url: config?.bridal_shower_hero_url || "",
            pix_key: config?.pix_key || "",
            contact_phone_gabriel: config?.contact_phone_gabriel || "",
            contact_phone_raabe: config?.contact_phone_raabe || ""
        }
    });

    // Sincronizar formulário quando config for recarregado
    useEffect(() => {
        if (config) {
            form.reset({
                date: formatDate(config.bridal_shower_date),
                location: config.bridal_shower_location || "",
                address_1: config.bridal_shower_address_1 || "",
                map_link_1: config.bridal_shower_map_link_1 || "",
                date_2: formatDate(config.bridal_shower_date_2),
                location_2: config.bridal_shower_location_2 || "",
                address_2: config.bridal_shower_address_2 || "",
                map_link_2: config.bridal_shower_map_link_2 || "",
                hero_url: config.bridal_shower_hero_url || "",
                pix_key: config.pix_key || "",
                contact_phone_gabriel: config.contact_phone_gabriel || "",
                contact_phone_raabe: config.contact_phone_raabe || ""
            });
        }
    }, [config, form]);

    const onSubmit = (data: UpdateConfigInput) => {
        if (!config) return;
        updateConfig.mutate({ id: config.id, updates: data });
    };

    return (
        <Card className="bg-stone-50 border-stone-200">
            <CardContent className="p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs defaultValue="local1" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="local1">Local 1</TabsTrigger>
                                <TabsTrigger value="local2">Local 2</TabsTrigger>
                                <TabsTrigger value="contato">Contato</TabsTrigger>
                                <TabsTrigger value="geral">Geral</TabsTrigger>
                            </TabsList>

                            <TabsContent value="local1" className="space-y-3 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Data e Hora (Local 1)</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Local 1</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Salão de Festas A" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address_1"
                                        render={({ field }: { field: any }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel>Endereço Completo (Local 1)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Rua, Número, Bairro, Cidade" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="map_link_1"
                                        render={({ field }: { field: any }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel>Link do Google Maps (Local 1)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://maps.google.com/..." className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="local2" className="space-y-3 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date_2"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Data e Hora (Local 2)</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="location_2"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Local 2</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Casa da Mãe" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address_2"
                                        render={({ field }: { field: any }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel>Endereço Completo (Local 2)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Rua, Número, Bairro, Cidade" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="map_link_2"
                                        render={({ field }: { field: any }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel>Link do Google Maps (Local 2)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://maps.google.com/..." className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="contato" className="space-y-3 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contact_phone_gabriel"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp Gabriel</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="5511999999999" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="contact_phone_raabe"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp Raabe</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="5511999999999" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="geral" className="space-y-3 mt-4">
                                <FormField
                                    control={form.control}
                                    name="hero_url"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>URL da Imagem de Fundo (Hero)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." className="bg-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pix_key"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Chave Pix</FormLabel>
                                            <FormControl>
                                                <Input placeholder="CPF, Email ou Aleatória" className="bg-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </Tabs>

                        <Button type="submit" size="sm" className="w-full mt-4 bg-stone-900 hover:bg-stone-800" disabled={updateConfig.isPending}>
                            {updateConfig.isPending ? "Salvando..." : "Salvar Configurações"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function AddGiftDialog({ open, onOpenChange, createGift }: { open: boolean, onOpenChange: (open: boolean) => void, createGift: any }) {
    const form = useForm<CreateGiftInput>({
        resolver: zodResolver(CreateGiftSchema),
        defaultValues: {
            item_name: "",
            category: "Outros",
            suggested_store: "",
            price_range: "",
            link: "",
            image_url: ""
        }
    });

    const onSubmit = (data: CreateGiftInput) => {
        createGift.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Presente</DialogTitle>
                    <DialogDescription>Adicione um novo item à sua lista.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                        <FormField
                            control={form.control}
                            name="item_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Nome do Item (ex: Liquidificador)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Categoria" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {GIFT_CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <FormField
                                control={form.control}
                                name="suggested_store"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Loja (Opcional)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price_range"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Preço (ex: R$ 100)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Link do Produto (http://...)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="image_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="URL da Imagem (Opcional)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createGift.isPending}>Adicionar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function EditGiftDialog({ open, onOpenChange, gift, updateGift }: { open: boolean, onOpenChange: (open: boolean) => void, gift: Gift | null, updateGift: any }) {
    const form = useForm<UpdateGiftInput>({
        resolver: zodResolver(UpdateGiftSchema),
        defaultValues: {
            id: gift?.id || "",
            item_name: gift?.item_name || "",
            category: (gift?.category as any) || "Outros",
            suggested_store: gift?.suggested_store || "",
            price_range: gift?.price_range || "",
            link: gift?.link || "",
            image_url: gift?.image_url || ""
        }
    });

    // Update form values when gift changes
    if (gift && form.getValues("id") !== gift.id) {
        form.reset({
            id: gift.id,
            item_name: gift.item_name,
            category: (gift.category as any) || "Outros",
            suggested_store: gift.suggested_store || "",
            price_range: gift.price_range || "",
            link: gift.link || "",
            image_url: gift.image_url || ""
        });
    }

    const onSubmit = (data: UpdateGiftInput) => {
        updateGift.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Presente</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                        <FormField
                            control={form.control}
                            name="item_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Nome do Item" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Categoria" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {GIFT_CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <FormField
                                control={form.control}
                                name="suggested_store"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Loja (Opcional)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price_range"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Preço (ex: R$ 100)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Link do Produto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="image_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="URL da Imagem" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={updateGift.isPending}>Salvar Alterações</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function AddGuestDialog({ open, onOpenChange, createGuest }: { open: boolean, onOpenChange: (open: boolean) => void, createGuest: any }) {
    const form = useForm<CreateGuestInput>({
        resolver: zodResolver(CreateGuestSchema),
        defaultValues: {
            name: "",
            phone: ""
        }
    });

    const onSubmit = (data: CreateGuestInput) => {
        createGuest.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Convidado</DialogTitle>
                    <DialogDescription>Adicione um novo convidado à sua lista.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Nome" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Telefone (Opcional)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createGuest.isPending}>Adicionar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
