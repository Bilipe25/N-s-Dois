import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List as ListIcon } from "lucide-react";
import type { Route } from "./+types/suppliers";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { SupplierKanban } from "@/components/suppliers/supplier-kanban";
import { Supplier } from "@/components/suppliers/types";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Fornecedores - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);

    // Fetch Suppliers
    const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

    if (suppliersError) {
        console.error("Error fetching suppliers:", suppliersError);
        return { suppliers: [] };
    }

    // Fetch Budget Items for calculation
    const { data: budgetItems, error: budgetError } = await supabase
        .from("budget_items")
        .select("supplier_id, paid_value")
        .not("supplier_id", "is", null);

    if (budgetError) {
        console.error("Error fetching budget for suppliers:", budgetError);
    }

    // Calculate total paid per supplier
    const suppliers = (suppliersData as Supplier[]).map(supplier => {
        const totalPaid = budgetItems
            ?.filter(item => item.supplier_id === supplier.id)
            .reduce((sum, item) => sum + (item.paid_value || 0), 0) || 0;

        return { ...supplier, total_paid: totalPaid };
    });

    return { suppliers };
};

export default function Suppliers() {
    const { suppliers } = useLoaderData<typeof loader>();
    const [view, setView] = useState<"list" | "kanban">("list");
    const [filter, setFilter] = useState<"todos" | "contratado" | "pendente">("todos");

    const filteredSuppliers = suppliers.filter((s) => {
        if (filter === "todos") return true;
        if (filter === "pendente") return s.status !== "contratado" && s.status !== "pago";
        return s.status === filter || (filter === "contratado" && s.status === "pago");
    });

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 sticky top-0 z-10 px-4 py-3">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="font-semibold text-stone-900">Fornecedores</h1>
                    <Button size="sm" className="rounded-full shadow-sm bg-stone-900 text-white hover:bg-stone-800" asChild>
                        <Link to="/suppliers/new">
                            <Plus className="h-4 w-4 mr-1" /> Novo
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 space-y-6">
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
                                    <SupplierCard key={supplier.id} supplier={supplier} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="kanban" className="mt-0">
                        <SupplierKanban suppliers={suppliers} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
