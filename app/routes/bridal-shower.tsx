import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link as LinkIcon, ExternalLink, X, Upload, Download, MoreVertical, Edit, Check } from "lucide-react";
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
    useCreateGift,
    useUpdateGift,
    useDeleteGift,
    useCancelGiftReservation,
    useBulkUpdateCategory,
    useImportGifts
} from "@/hooks/useBridalShower";
import { useGuests as useMainGuests } from "@/hooks/useGuests";

// Extracted Components
import { CelebrationAdminControlPanel } from "@/components/celebration/admin-control-panel";
import { AdminAddGiftDrawer } from "@/components/bridal-shower/admin-add-gift-drawer";
import { AdminEditGiftDrawer } from "@/components/bridal-shower/admin-edit-gift-drawer";
import { AdminGiftDetailsDrawer } from "@/components/bridal-shower/admin-gift-details-drawer";
import { CelebrationWhatsAppComposer, type CelebrationWhatsAppComposerData } from "@/components/celebration/whatsapp-message-composer";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Administração da Celebração - Nós Dois" }];
};

export default function BridalShower() {
    const { data: gifts = [] } = useGifts();
    const { data: guests = [] } = useMainGuests();

    // Mutations
    const createGift = useCreateGift();
    const updateGift = useUpdateGift();
    const deleteGift = useDeleteGift();
    const cancelGiftReservation = useCancelGiftReservation();
    const bulkUpdateCategory = useBulkUpdateCategory();
    const importGifts = useImportGifts();

    const [showQrCode, setShowQrCode] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showAddGift, setShowAddGift] = useState(false);
    const [showEditGift, setShowEditGift] = useState(false);
    const [editingGift, setEditingGift] = useState<Gift | null>(null);

    // Filters & Selection
    const [giftSearch, setGiftSearch] = useState("");
    const [giftCategory, setGiftCategory] = useState<GiftCategory | null>(null);
    const [giftStatus, setGiftStatus] = useState<"all" | "disponivel" | "comprado">("all");
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [showBulkCategory, setShowBulkCategory] = useState(false);
    const [bulkCategory, setBulkCategory] = useState<GiftCategory | "">("");
    const [selectedGiftDetails, setSelectedGiftDetails] = useState<Gift | null>(null);
    const [whatsappData, setWhatsappData] = useState<CelebrationWhatsAppComposerData | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Import Text State
    const [importGiftsText, setImportGiftsText] = useState("");

    const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/celebracao` : "";

    useEffect(() => {
        const giftId = searchParams.get("gift");
        if (!giftId || gifts.length === 0) return;
        const gift = gifts.find((item) => item.id === giftId);
        if (gift) setSelectedGiftDetails(gift);
    }, [gifts, searchParams]);

    const openGiftDetails = (gift: Gift) => {
        setSelectedGiftDetails(gift);
        const next = new URLSearchParams(searchParams);
        next.set("gift", gift.id);
        setSearchParams(next, { replace: true });
    };

    const closeGiftDetails = () => {
        setSelectedGiftDetails(null);
        const next = new URLSearchParams(searchParams);
        next.delete("gift");
        setSearchParams(next, { replace: true });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        toast.success("Link público copiado para a área de transferência!");
    };

    const filteredGifts = gifts.filter((g) => {
        const matchesSearch = g.item_name.toLowerCase().includes(giftSearch.toLowerCase()) ||
            (g.suggested_store && g.suggested_store.toLowerCase().includes(giftSearch.toLowerCase()));
        const matchesCategory = giftCategory ? g.category === giftCategory : true;
        const isReserved = Boolean(g.active_reservation);
        const matchesStatus = giftStatus === "all" ? true : giftStatus === "comprado" ? isReserved : !isReserved;
        return matchesSearch && matchesCategory && matchesStatus;
    });


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

    const openGiftWhatsAppComposer = (gift: Gift) => {
        const reservation = gift.active_reservation;
        if (!reservation) return;
        setWhatsappData({
            guestName: reservation.guest_name,
            phone: reservation.guest_phone,
            rsvpStatus: reservation.guest_rsvp_status,
            adults: reservation.guest_adults,
            children: reservation.guest_children,
            gifts: [gift.item_name],
            context: "gift_reserved",
        });
        closeGiftDetails();
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

    const exportGiftsToCSV = () => {
        const headers = ["Nome", "Categoria", "Faixa de Preço", "Status", "Reservado Por", "Data da Reserva"];
        const rows = gifts.map(g => [
            `"${g.item_name.replace(/"/g, '""')}"`,
            `"${g.category || ''}"`,
            `"${g.price_range || ''}"`,
            `"${g.active_reservation ? "Reservado" : "Disponível"}"`,
            `"${(g.active_reservation?.guest_name || '').replace(/"/g, '""')}"`,
            `"${g.active_reservation?.reserved_at ? new Date(g.active_reservation.reserved_at).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }) : ''}"`
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
            [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "presentes-cha-casa-nova.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 relative min-h-screen pb-24">
            <CelebrationAdminControlPanel />
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

            <Tabs defaultValue="gifts" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="gifts">Presentes</TabsTrigger>
                    <Button variant="ghost" asChild className="h-9">
                        <Link to="/guests">Convites e RSVP</Link>
                    </Button>
                </TabsList>

                {/* Aba de Presentes */}
                <TabsContent id="presentes" value="gifts" className="space-y-4 mt-4">
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
                            filteredGifts.map((gift) => {
                                const isReserved = Boolean(gift.active_reservation);
                                return (
                                <div
                                    key={gift.id}
                                    className={`p-3 border rounded-lg flex gap-3 items-start cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${isReserved ? 'bg-green-50/50 border-green-200' : 'bg-white shadow-sm hover:border-stone-300'}`}
                                    onClick={() => openGiftDetails(gift)}
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
                                                <p className={`font-medium ${isReserved ? 'text-green-800' : ''}`}>
                                                    {gift.item_name}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {gift.category && <Badge variant="secondary" className="text-xs">{gift.category}</Badge>}
                                                    {gift.suggested_store && <Badge variant="outline" className="text-xs">{gift.suggested_store}</Badge>}
                                                    {gift.price_range && <Badge variant="outline" className="text-xs">{gift.price_range}</Badge>}
                                                </div>
                                                {gift.active_reservation && (
                                                    <div className="mt-1 space-y-0.5 text-xs text-green-700">
                                                        <p className="font-medium flex items-center gap-1">
                                                            <Check className="h-3 w-3" /> Reservado por {gift.active_reservation.guest_name}
                                                        </p>
                                                        <time dateTime={gift.active_reservation.reserved_at} className="block text-stone-500">
                                                            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Fortaleza" }).format(new Date(gift.active_reservation.reserved_at))}
                                                        </time>
                                                    </div>
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
                                                        {gift.active_reservation && <button
                                                            onClick={() => {
                                                                if (confirm(`Cancelar a reserva de ${gift.item_name}? O presente voltará a ficar disponível.`)) {
                                                                    cancelGiftReservation.mutate(gift.active_reservation!.id);
                                                                }
                                                            }}
                                                            className="w-full flex items-center px-2 py-1.5 text-sm text-amber-700 outline-none hover:bg-amber-50 cursor-pointer"
                                                        >
                                                            <X className="mr-2 h-4 w-4" /> Cancelar reserva
                                                        </button>}
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
                                );
                            })
                        )}
                    </div>

                    {!selectedGiftDetails && (
                        <div className="fixed bottom-safe-24 right-6 z-40 flex flex-col gap-3">
                            <Button
                                onClick={exportGiftsToCSV}
                                size="icon"
                                variant="secondary"
                                className="h-10 w-10 rounded-full shadow-md"
                                title="Exportar Relatório CSV"
                            >
                                <Download className="h-5 w-5" />
                            </Button>
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

            </Tabs>

            {/* Modals & Drawers */}
            <AdminAddGiftDrawer open={showAddGift} onOpenChange={setShowAddGift} createGift={createGift} />
            <AdminEditGiftDrawer open={showEditGift} onOpenChange={setShowEditGift} gift={editingGift} updateGift={updateGift} />
            <AdminGiftDetailsDrawer gift={selectedGiftDetails} onClose={closeGiftDetails} onEdit={handleEditGift} cancelReservation={cancelGiftReservation} onWhatsApp={openGiftWhatsAppComposer} />
            <CelebrationWhatsAppComposer
                open={Boolean(whatsappData)}
                onOpenChange={(open) => { if (!open) setWhatsappData(null); }}
                data={whatsappData}
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
