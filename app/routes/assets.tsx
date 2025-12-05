import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, X, Loader2, DollarSign, Package, Search, Gift, ArrowRight } from "lucide-react";
import type { Route } from "./+types/assets";
import { useAssets, useDeleteAsset, useCreateAsset, type Asset, type ReservedGift } from "@/hooks/useAssets";
import { AddAssetDialog } from "@/components/assets/add-asset-dialog";
import { motion, AnimatePresence } from "framer-motion";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Nossos Bens - Nós Dois" }];
};

const CATEGORIES = ["Cozinha", "Sala", "Quarto", "Banheiro", "Lavanderia", "Escritório", "Outros"];

export default function Assets() {
    const { data, isLoading } = useAssets();
    const { mutate: deleteAsset, isPending: isDeleting } = useDeleteAsset();
    const { mutate: createAsset, isPending: isAddingGift } = useCreateAsset();

    const assets = data?.assets || [];
    const reservedGifts = data?.reservedGifts || [];

    const [filter, setFilter] = useState<string>("todos");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);

    const categories = ["todos", ...CATEGORIES];

    // Filtrar assets
    const filteredAssets = assets.filter((item) => {
        const matchesFilter = filter === "todos" || item.category === filter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Cálculos
    const totalValue = assets.reduce((acc, item) => acc + (item.value || 0), 0);
    const totalItems = assets.length;

    const handleDelete = () => {
        if (selectedAsset) {
            deleteAsset(selectedAsset.id, {
                onSuccess: () => setSelectedAsset(null)
            });
        }
    };

    const handleAddGift = (gift: ReservedGift) => {
        const formData = new FormData();
        formData.append("name", gift.item_name);
        formData.append("category", gift.category || "Outros");
        formData.append("value", "0");
        formData.append("notes", `Presente do Chá de Casa Nova • Reservado por: ${gift.reserved_by || "Anônimo"}`);
        if (gift.image_url) {
            formData.append("photo_url", gift.image_url);
        }
        createAsset(formData);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24">
            <header>
                <p className="text-sm text-muted-foreground">Inventário da nossa casa</p>
            </header>

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                        <DollarSign className="h-4 w-4 text-primary mb-1" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Valor Total</span>
                        <span className="text-sm font-bold text-primary">
                            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                        <Package className="h-4 w-4 text-primary mb-1" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</span>
                        <span className="text-sm font-bold text-primary">{totalItems}</span>
                    </CardContent>
                </Card>
            </div>

            {/* Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Tabs: Meus Bens | Presentes do Chá */}
            <Tabs defaultValue="bens" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bens">Meus Bens</TabsTrigger>
                    <TabsTrigger value="presentes" className="relative">
                        Presentes do Chá
                        {reservedGifts.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                                {reservedGifts.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Meus Bens */}
                <TabsContent value="bens" className="mt-4 space-y-4">
                    {/* Filtros por Categoria */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap ${filter === cat
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Lista de Bens */}
                    <AnimatePresence mode="popLayout">
                        {filteredAssets.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 text-muted-foreground text-sm"
                            >
                                {searchTerm ? "Nenhum item encontrado na busca." : "Nenhum item nesta categoria."}
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAssets.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-secondary/20 transition-colors cursor-pointer"
                                        onClick={() => setSelectedAsset(item)}
                                    >
                                        <div className="h-14 w-14 rounded-lg bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                                            {item.photo_url ? (
                                                <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-6 w-6 text-muted-foreground opacity-50" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-medium text-sm truncate">{item.name}</h3>
                                                <span className="text-xs font-bold text-primary whitespace-nowrap">
                                                    {(item.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{item.category}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </TabsContent>

                {/* Tab: Presentes do Chá */}
                <TabsContent value="presentes" className="mt-4 space-y-4">
                    {reservedGifts.length === 0 ? (
                        <div className="text-center py-12">
                            <Gift className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">
                                Nenhum presente reservado ainda.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-muted-foreground">
                                Presentes reservados no Chá de Casa Nova:
                            </p>
                            <div className="space-y-3">
                                {reservedGifts.map((gift) => (
                                    <motion.div
                                        key={gift.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-card"
                                    >
                                        <div className="h-14 w-14 rounded-lg bg-rose-50 dark:bg-rose-900/20 overflow-hidden shrink-0 flex items-center justify-center">
                                            {gift.image_url ? (
                                                <img src={gift.image_url} alt={gift.item_name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Gift className="h-6 w-6 text-rose-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm truncate">{gift.item_name}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Reservado por: {gift.reserved_by || "Anônimo"}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAddGift(gift)}
                                            disabled={isAddingGift}
                                            className="shrink-0"
                                        >
                                            {isAddingGift ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Adicionar <ArrowRight className="ml-1 h-3 w-3" />
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* FAB - Botão Flutuante para Adicionar */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-24 right-4 z-40"
            >
                <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg"
                    onClick={() => setShowAddDialog(true)}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </motion.div>

            {/* Dialog para Adicionar */}
            <AddAssetDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

            {/* Dialog de Detalhes */}
            <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
                <DialogContent className="max-w-sm w-full p-0 overflow-hidden bg-background">
                    {selectedAsset && (
                        <div className="flex flex-col">
                            <div className="h-48 bg-secondary flex items-center justify-center relative">
                                {selectedAsset.photo_url ? (
                                    <img
                                        src={selectedAsset.photo_url}
                                        alt={selectedAsset.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package className="h-16 w-16 text-muted-foreground opacity-30" />
                                )}
                                <button
                                    onClick={() => setSelectedAsset(null)}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <h2 className="text-xl font-serif font-bold">{selectedAsset.name}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedAsset.category}</p>
                                </div>

                                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                                    <DollarSign className="h-5 w-5" />
                                    {(selectedAsset.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>

                                {selectedAsset.notes && (
                                    <div className="bg-secondary/50 p-3 rounded-md text-sm text-muted-foreground">
                                        {selectedAsset.notes}
                                    </div>
                                )}

                                <div className="pt-4 border-t flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">
                                        Adicionado em {new Date(selectedAsset.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
