import { useState } from "react";
import { useLoaderData, useSubmit } from "react-router";
import { createClient } from "@/lib/supabase";
import { Plus, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Route } from "./+types/budget";

import { BudgetSummary } from "@/components/budget/budget-summary";
import { BudgetCharts } from "@/components/budget/budget-charts";
import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetForm } from "@/components/budget/budget-form";
import { BUDGET_CATEGORIES, type BudgetItem } from "@/components/budget/types";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Orçamento - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: items, error } = await supabase
        .from("budget_items")
        .select("*, suppliers(name)")
        .order("created_at", { ascending: false });

    const { data: suppliers } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");

    if (error) {
        console.error("Error fetching budget:", error);
        return { items: [], suppliers: [] };
    }

    return { items: items as BudgetItem[], suppliers: suppliers || [] };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add" || intent === "update") {
        const description = formData.get("description") as string;
        const category = formData.get("category") as string;
        const estimated_value = parseFloat(formData.get("estimated_value") as string) || 0;
        const paid_value = parseFloat(formData.get("paid_value") as string) || 0;
        const installments_current = parseInt(formData.get("installments_current") as string) || 1;
        const installments_total = parseInt(formData.get("installments_total") as string) || 1;
        const due_date = formData.get("due_date") as string || null;
        let supplier_id = formData.get("supplier_id") as string | null;

        if (supplier_id === "none") supplier_id = null;

        const status = paid_value >= estimated_value ? "pago" : paid_value > 0 ? "parcial" : "pendente";
        // Simple logic for 'atrasado': if due_date < today and status != pago
        const isLate = due_date && new Date(due_date) < new Date() && status !== "pago";
        const finalStatus = isLate ? "atrasado" : status;

        const data = {
            description,
            category,
            estimated_value,
            paid_value,
            status: finalStatus,
            installments_total,
            due_date,
            supplier_id
        };

        if (intent === "add") {
            await supabase.from("budget_items").insert(data);
        } else {
            const id = formData.get("id") as string;
            await supabase.from("budget_items").update(data).eq("id", id);
        }
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("budget_items").delete().eq("id", id);
    }

    return null;
};

export default function Budget() {
    const { items, suppliers } = useLoaderData<typeof loader>();
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

    const totalEstimated = items.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);
    const totalPaid = items.reduce((acc, curr) => acc + (Number(curr.paid_value) || 0), 0);
    const progress = totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 0;

    const filteredItems = categoryFilter === "all"
        ? items
        : items.filter(item => item.category === categoryFilter);

    const handleEdit = (item: BudgetItem) => {
        setEditingItem(item);
        setIsAddOpen(true);
    };

    const handleClose = () => {
        setIsAddOpen(false);
        setEditingItem(null);
    };

    const handleExport = () => {
        const headers = ["Descrição", "Categoria", "Valor Orçado", "Valor Pago", "Status", "Parcela", "Vencimento"];
        const csvContent = [
            headers.join(","),
            ...items.map(item => [
                `"${item.description}"`,
                `"${item.category}"`,
                item.estimated_value,
                item.paid_value,
                item.status,
                `${item.installments_current}/${item.installments_total}`,
                item.due_date || ""
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "orcamento_casamento.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
                <div className="px-4 py-3 flex justify-between items-center max-w-md mx-auto md:max-w-4xl">
                    <h1 className="font-semibold text-stone-900">Gestão Financeira</h1>
                    <Button variant="ghost" size="sm" onClick={handleExport} className="text-stone-500">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="max-w-md mx-auto md:max-w-4xl p-4 space-y-6">
                <BudgetSummary
                    totalEstimated={totalEstimated}
                    totalPaid={totalPaid}
                    progress={progress}
                />

                <BudgetCharts items={items} />

                {/* Filters */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-stone-900">Transações</h3>
                        <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3 text-stone-400" />
                            <span className="text-xs text-stone-500">Filtrar por:</span>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <button
                            onClick={() => setCategoryFilter("all")}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === "all"
                                ? "bg-stone-900 text-white"
                                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                                }`}
                        >
                            Todas
                        </button>
                        {BUDGET_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat
                                    ? "bg-stone-900 text-white"
                                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-200">
                            <p className="text-stone-400 text-sm">Nenhum gasto encontrado.</p>
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <BudgetCard key={item.id} item={item} onEdit={handleEdit} />
                        ))
                    )}
                </div>
            </div>

            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-20 md:right-[calc(50%-20rem)]">
                <Button
                    onClick={() => { setEditingItem(null); setIsAddOpen(true); }}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-xl bg-stone-900 hover:bg-stone-800 text-white transition-transform hover:scale-105 active:scale-95"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Dialog Form */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar Gasto" : "Novo Gasto"}</DialogTitle>
                    </DialogHeader>
                    <BudgetForm item={editingItem} suppliers={suppliers} onCancel={handleClose} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
