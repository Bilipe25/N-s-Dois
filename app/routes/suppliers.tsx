import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List as ListIcon, Phone, MessageCircle, FileText, Pencil, X, Loader2 } from "lucide-react";
import type { Route } from "./+types/suppliers";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { SupplierKanban } from "@/components/suppliers/supplier-kanban";
import type { Supplier } from "@/components/suppliers/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useSuppliers } from "@/hooks/useSuppliers";
import { createClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Fornecedores - Nós Dois" }];
};

// Helper hook for budget items (temporary until full migration)
const useBudgetItems = () => {
    return useQuery({
        queryKey: ["budget_items_simple"],
        queryFn: async () => {
            const supabase = createClient(null as any);
            const { data, error } = await supabase
                .from("budget_items")
                .select("supplier_id, paid_value")
                .not("supplier_id", "is", null);
            if (error) throw error;
            return data;
        }
    });
};

export default function Suppliers() {
    const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers();
    const { data: budgetItems } = useBudgetItems();

    const [view, setView] = useState<"list" | "kanban">("list");
    const [filter, setFilter] = useState<"todos" | "contratado" | "pendente">("todos");
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Calculate total paid per supplier
    const suppliers = (suppliersData as Supplier[] || []).map(supplier => {
        const totalPaid = budgetItems
            ?.filter(item => item.supplier_id === supplier.id)
            .reduce((sum, item) => sum + (item.paid_value || 0), 0) || 0;

        return { ...supplier, total_paid: totalPaid };
    });

    const filteredSuppliers = suppliers.filter((s) => {
        if (filter === "todos") return true;
        if (filter === "pendente") return s.status !== "contratado" && s.status !== "pago";
        return s.status === filter || (filter === "contratado" && s.status === "pago");
    });

    const getWhatsAppLink = (contact?: string | null) => {
        if (!contact) return null;
        const nums = contact.replace(/\D/g, "");
        if (nums.length >= 10) return `https://wa.me/55${nums}`;
        return null;
    };

    if (isLoadingSuppliers) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header removed as title is in TopNav */}

            <div className="max-w-5xl mx-auto p-4 space-y-6 pt-6">
                <Tabs defaultValue="list" className="w-full" onValueChange={(v) => setView(v as "list" | "kanban")}>
                    <div className="flex justify-between items-center mb-4">
                        {/* View Switcher */}
                        <TabsList className="grid w-[180px] grid-cols-2">
                            <TabsTrigger value="list">
                                <ListIcon className="h-4 w-4 mr-2" /> Lista
                            </TabsTrigger>
                            <TabsTrigger value="kanban">
                                <LayoutGrid className="h-4 w-4 mr-2" /> Quadro
                            </TabsTrigger>
                        </TabsList>

                        {/* Filter (Only for List view usually, but keeping for both) */}
                        {view === "list" && (
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                {["todos", "contratado", "pendente"].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap ${filter === f
                                            ? "bg-stone-900 text-white"
                                            : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <TabsContent value="list" className="mt-0">
                        {filteredSuppliers.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-200">
                                <p className="text-stone-400 text-sm">Nenhum fornecedor encontrado.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredSuppliers.map((supplier) => (
                                    <SupplierCard
                                        key={supplier.id}
                                        supplier={supplier}
                                        onClick={(s) => setSelectedSupplier(s)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="kanban" className="mt-0">
                        <SupplierKanban suppliers={suppliers} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* FAB - Floating Action Button */}
            <Link
                to="/suppliers/new"
                className="fixed bottom-20 right-4 h-14 w-14 bg-stone-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-800 transition-transform hover:scale-105 active:scale-95 z-40"
            >
                <Plus className="h-6 w-6" />
            </Link>

            {/* Details Dialog */}
            <Dialog open={!!selectedSupplier} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
                    {selectedSupplier && (
                        <>
                            {selectedSupplier.photo_url && (
                                <div className="h-40 w-full relative">
                                    <img
                                        src={selectedSupplier.photo_url}
                                        alt={selectedSupplier.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-white hover:bg-black/20 rounded-full"
                                        onClick={() => setSelectedSupplier(null)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                    <div className="absolute bottom-3 left-4 text-white">
                                        <Badge variant="secondary" className="mb-1 bg-white/20 text-white hover:bg-white/30 border-none backdrop-blur-sm">
                                            {selectedSupplier.category}
                                        </Badge>
                                        <DialogTitle className="text-xl font-bold text-white leading-tight">
                                            {selectedSupplier.name}
                                        </DialogTitle>
                                    </div>
                                </div>
                            )}

                            {!selectedSupplier.photo_url && (
                                <DialogHeader className="p-6 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Badge variant="outline" className="mb-2">
                                                {selectedSupplier.category}
                                            </Badge>
                                            <DialogTitle className="text-xl font-bold">
                                                {selectedSupplier.name}
                                            </DialogTitle>
                                        </div>
                                        <DialogClose asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </DialogClose>
                                    </div>
                                </DialogHeader>
                            )}

                            <div className="p-6 space-y-6">
                                {/* Status & Financials */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-xs text-stone-500 uppercase font-medium">Status</span>
                                        <div>
                                            <Badge variant="outline" className="capitalize">
                                                {selectedSupplier.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    {(selectedSupplier.price || selectedSupplier.total_paid) && (
                                        <div className="space-y-1">
                                            <span className="text-xs text-stone-500 uppercase font-medium">Financeiro</span>
                                            <div className="text-sm">
                                                {selectedSupplier.price && (
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-stone-500">Total:</span>
                                                        <span className="font-medium">
                                                            {Number(selectedSupplier.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedSupplier.total_paid ? (
                                                    <div className="flex justify-between gap-2 text-emerald-600">
                                                        <span>Pago:</span>
                                                        <span className="font-medium">
                                                            {Number(selectedSupplier.total_paid).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Contact */}
                                {selectedSupplier.contact_info && (
                                    <div className="space-y-2">
                                        <span className="text-xs text-stone-500 uppercase font-medium">Contato</span>
                                        <div className="flex items-center justify-between bg-stone-50 p-3 rounded-lg border border-stone-100">
                                            <div className="flex items-center gap-3 text-stone-700">
                                                <Phone className="h-4 w-4 text-stone-400" />
                                                <span className="text-sm">{selectedSupplier.contact_info}</span>
                                            </div>
                                            {getWhatsAppLink(selectedSupplier.contact_info) && (
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" asChild>
                                                    <a href={getWhatsAppLink(selectedSupplier.contact_info)!} target="_blank" rel="noopener noreferrer">
                                                        <MessageCircle className="h-5 w-5" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedSupplier.notes && (
                                    <div className="space-y-2">
                                        <span className="text-xs text-stone-500 uppercase font-medium">Notas</span>
                                        <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 text-sm text-stone-600 italic">
                                            "{selectedSupplier.notes}"
                                        </div>
                                    </div>
                                )}

                                {/* Contract */}
                                {selectedSupplier.contract_url && (
                                    <Button variant="outline" className="w-full" asChild>
                                        <a href={selectedSupplier.contract_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="h-4 w-4 mr-2" /> Ver Contrato Anexado
                                        </a>
                                    </Button>
                                )}
                            </div>

                            <DialogFooter className="p-4 bg-stone-50 border-t border-stone-100 flex-row gap-2 justify-end">
                                <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
                                    Fechar
                                </Button>
                                <Button asChild className="bg-stone-900 text-white hover:bg-stone-800">
                                    <Link to={`/suppliers/${selectedSupplier.id}`}>
                                        <Pencil className="h-4 w-4 mr-2" /> Editar
                                    </Link>
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
