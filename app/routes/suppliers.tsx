import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List as ListIcon, Phone, MessageCircle, FileText, Pencil, Loader2, Trash2, Store, DollarSign, CheckCircle2 } from "lucide-react";
import type { Route } from "./+types/suppliers";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { SupplierKanban } from "@/components/suppliers/supplier-kanban";
import type { Supplier } from "@/components/suppliers/types";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { useSuppliers, useDeleteSupplier } from "@/hooks/useSuppliers";
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
    const { mutate: deleteSupplier } = useDeleteSupplier();

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

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
            deleteSupplier(id);
            setSelectedSupplier(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "contratado": return "bg-green-100 text-green-700";
            case "pago": return "bg-blue-100 text-blue-700";
            case "negociando": return "bg-amber-100 text-amber-700";
            case "pesquisando": return "bg-purple-100 text-purple-700";
            default: return "bg-stone-100 text-stone-700";
        }
    };

    // Stats
    const contratados = suppliers.filter(s => s.status === "contratado" || s.status === "pago").length;
    const totalValue = suppliers.reduce((sum, s) => sum + (s.price || 0), 0);
    const totalPaid = suppliers.reduce((sum, s) => sum + (s.total_paid || 0), 0);

    if (isLoadingSuppliers) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            <div className="max-w-5xl mx-auto p-4 space-y-4 pt-4">
                {/* Stats Header */}
                <div className="flex justify-between items-center bg-white rounded-xl p-4 border border-stone-200">
                    <div className="text-center flex-1">
                        <p className="text-2xl font-bold text-green-600">{contratados}</p>
                        <p className="text-xs text-stone-500">Contratados</p>
                    </div>
                    <div className="h-10 w-px bg-stone-200" />
                    <div className="text-center flex-1">
                        <p className="text-2xl font-bold text-stone-800">{suppliers.length}</p>
                        <p className="text-xs text-stone-500">Total</p>
                    </div>
                    <div className="h-10 w-px bg-stone-200" />
                    <div className="text-center flex-1">
                        <p className="text-lg font-bold text-blue-600">{(totalPaid / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}</p>
                        <p className="text-xs text-stone-500">Pago</p>
                    </div>
                </div>

                <Tabs defaultValue="list" className="w-full" onValueChange={(v) => setView(v as "list" | "kanban")}>
                    <div className="flex justify-between items-center mb-4">
                        {/* View Switcher */}
                        <TabsList className="grid w-[180px] grid-cols-2 bg-stone-100">
                            <TabsTrigger value="list" className="data-[state=active]:bg-white">
                                <ListIcon className="h-4 w-4 mr-2" /> Lista
                            </TabsTrigger>
                            <TabsTrigger value="kanban" className="data-[state=active]:bg-white">
                                <LayoutGrid className="h-4 w-4 mr-2" /> Quadro
                            </TabsTrigger>
                        </TabsList>

                        {/* Filter (Only for List view usually, but keeping for both) */}
                        {view === "list" && (
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                {[
                                    { id: "todos", label: "Todos" },
                                    { id: "contratado", label: "Contratados" },
                                    { id: "pendente", label: "Pendentes" }
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id as any)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${filter === f.id
                                            ? "bg-stone-900 text-white"
                                            : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <TabsContent value="list" className="mt-0">
                        {filteredSuppliers.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-200 flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                                    <Store className="h-8 w-8 text-stone-300" />
                                </div>
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
            {!selectedSupplier && (
                <Link
                    to="/suppliers/new"
                    className="fixed bottom-24 right-6 h-14 w-14 bg-stone-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-800 transition-transform hover:scale-105 active:scale-95 z-40"
                >
                    <Plus className="h-6 w-6" />
                </Link>
            )}

            {/* Details Drawer */}
            <Drawer open={!!selectedSupplier} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
                <DrawerContent className="max-h-[90vh]">
                    {selectedSupplier && (
                        <>
                            {/* Header with photo or simple */}
                            {selectedSupplier.photo_url ? (
                                <div className="relative h-48 w-full">
                                    <img
                                        src={selectedSupplier.photo_url}
                                        alt={selectedSupplier.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <Badge className={`${getStatusColor(selectedSupplier.status)} border-0 mb-2`}>
                                            {selectedSupplier.status}
                                        </Badge>
                                        <h2 className="text-2xl font-bold text-white">{selectedSupplier.name}</h2>
                                        <p className="text-white/80 text-sm">{selectedSupplier.category}</p>
                                    </div>
                                </div>
                            ) : (
                                <DrawerHeader className="text-left border-b pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-stone-100">
                                            <Store className="h-6 w-6 text-stone-600" />
                                        </div>
                                        <div>
                                            <DrawerTitle className="text-xl">{selectedSupplier.name}</DrawerTitle>
                                            <DrawerDescription className="flex items-center gap-2 mt-1">
                                                <Badge className={`${getStatusColor(selectedSupplier.status)} border-0 text-xs`}>
                                                    {selectedSupplier.status}
                                                </Badge>
                                                <span>{selectedSupplier.category}</span>
                                            </DrawerDescription>
                                        </div>
                                    </div>
                                </DrawerHeader>
                            )}

                            <div className="p-4 space-y-4 overflow-y-auto">
                                {/* Financeiro */}
                                {(selectedSupplier.price || selectedSupplier.total_paid) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedSupplier.price && (
                                            <div className="bg-stone-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    Valor Total
                                                </div>
                                                <p className="font-semibold text-stone-800">
                                                    {Number(selectedSupplier.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                        )}
                                        <div className="bg-green-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Valor Pago
                                            </div>
                                            <p className="font-semibold text-green-700">
                                                {Number(selectedSupplier.total_paid || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Contato */}
                                {selectedSupplier.contact_info && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-stone-500 font-medium">Contato</label>
                                        <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl">
                                            <div className="flex items-center gap-3 text-stone-700">
                                                <Phone className="h-4 w-4 text-stone-400" />
                                                <span className="text-sm">{selectedSupplier.contact_info}</span>
                                            </div>
                                            {getWhatsAppLink(selectedSupplier.contact_info) && (
                                                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full" asChild>
                                                    <a href={getWhatsAppLink(selectedSupplier.contact_info)!} target="_blank" rel="noopener noreferrer">
                                                        <MessageCircle className="h-5 w-5" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Notas */}
                                {selectedSupplier.notes && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-stone-500 font-medium">Notas</label>
                                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-sm text-stone-600">
                                            {selectedSupplier.notes}
                                        </div>
                                    </div>
                                )}

                                {/* Contrato */}
                                {selectedSupplier.contract_url && (
                                    <Button variant="outline" className="w-full" asChild>
                                        <a href={selectedSupplier.contract_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="h-4 w-4 mr-2" /> Ver Contrato Anexado
                                        </a>
                                    </Button>
                                )}

                                {/* Data de criação */}
                                {selectedSupplier.created_at && (
                                    <p className="text-xs text-stone-400 pt-2 border-t">
                                        Adicionado em {new Date(selectedSupplier.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                )}
                            </div>

                            <DrawerFooter className="flex-row gap-2 border-t pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => selectedSupplier.id && handleDelete(selectedSupplier.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                </Button>
                                <Button asChild className="flex-1 bg-stone-900 hover:bg-stone-800">
                                    <Link to={`/suppliers/${selectedSupplier.id}`}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </Link>
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}

