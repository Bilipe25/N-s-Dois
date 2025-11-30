import { useState } from "react";
import { useLoaderData, Form, Link, useSubmit, useFetcher } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, Download, Pencil, MoreHorizontal, Trash2, Filter } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Route } from "./+types/budget";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Orçamento - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: items, error } = await supabase
        .from("budget_items")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching budget:", error);
        return { items: [] };
    }

    return { items };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add") {
        const description = formData.get("description") as string;
        const category = formData.get("category") as string;
        const estimated_value = parseFloat(formData.get("estimated_value") as string) || 0;
        const paid_value = parseFloat(formData.get("paid_value") as string) || 0;

        if (!description) return null;

        await supabase.from("budget_items").insert({
            description,
            category,
            estimated_value,
            paid_value,
            status: paid_value >= estimated_value ? "pago" : paid_value > 0 ? "parcial" : "pendente"
        });

        // Notification for new payment
        if (paid_value > 0) {
            await supabase.from("notifications").insert({
                type: "budget",
                title: "Novo Pagamento Registrado 💰",
                message: `Um pagamento de R$ ${paid_value.toFixed(2)} foi registrado para "${description}".`,
                link: "/budget"
            });
        }
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("budget_items").delete().eq("id", id);
    } else if (intent === "update_value") {
        const id = formData.get("id") as string;
        const field = formData.get("field") as "estimated_value" | "paid_value";
        const value = parseFloat(formData.get("value") as string) || 0;

        // Fetch current item to update status correctly
        const { data: currentItem } = await supabase.from("budget_items").select("*").eq("id", id).single();

        if (currentItem) {
            const updates: any = { [field]: value };

            // Recalculate status
            const estimated = field === "estimated_value" ? value : currentItem.estimated_value;
            const paid = field === "paid_value" ? value : currentItem.paid_value;

            updates.status = paid >= estimated && estimated > 0 ? "pago" : paid > 0 ? "parcial" : "pendente";

            await supabase.from("budget_items").update(updates).eq("id", id);

            // Notification for payment update
            if (field === "paid_value" && value > currentItem.paid_value) {
                const diff = value - currentItem.paid_value;
                await supabase.from("notifications").insert({
                    type: "budget",
                    title: "Pagamento Atualizado 💰",
                    message: `Um valor adicional de R$ ${diff.toFixed(2)} foi registrado para "${currentItem.description}".`,
                    link: "/budget"
                });
            }
        }
    }

    return null;
};

const InlineCurrencyInput = ({ id, value, field, submit, className }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue !== value) {
            const formData = new FormData();
            formData.append("intent", "update_value");
            formData.append("id", id);
            formData.append("field", field);
            formData.append("value", currentValue.toString());
            submit(formData, { method: "post", replace: true });
        }
    };

    if (isEditing) {
        return (
            <Input
                type="number"
                step="0.01"
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBlur();
                }}
                autoFocus
                className={`h-6 p-1 ${className}`}
            />
        );
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-secondary/50 rounded px-1 transition-colors ${className}`}
        >
            {Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
    );
};

// Componente extraído para gerenciar estado e Optimistic UI
function BudgetItem({ item, submit }: any) {
    const fetcher = useFetcher();

    // Optimistic Delete
    const isDeleting = fetcher.formData?.get("intent") === "delete" && fetcher.formData.get("id") === item.id;

    if (isDeleting) return null;

    const itemProgress = item.estimated_value > 0 ? (item.paid_value / item.estimated_value) * 100 : 0;

    return (
        <div className="p-3 rounded-lg border bg-card border-border space-y-2">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground mr-1">Pago:</span>
                        <InlineCurrencyInput
                            id={item.id}
                            value={item.paid_value}
                            field="paid_value"
                            submit={submit}
                            className="font-bold text-sm w-20 text-right"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground mr-1">Orçado:</span>
                        <InlineCurrencyInput
                            id={item.id}
                            value={item.estimated_value}
                            field="estimated_value"
                            submit={submit}
                            className="text-[10px] text-muted-foreground w-16 text-right"
                        />
                    </div>
                </div>
            </div>

            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${itemProgress >= 100 ? 'bg-green-500' : 'bg-primary'
                        }`}
                    style={{ width: `${Math.min(itemProgress, 100)}%` }}
                />
            </div>
            <div className="flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to={`/budget/${item.id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                <Pencil className="h-4 w-4" />
                                <span>Editar</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <fetcher.Form method="post" className="w-full flex">
                                <input type="hidden" name="id" value={item.id} />
                                <button
                                    type="submit"
                                    name="intent"
                                    value="delete"
                                    className="flex w-full items-center gap-2 text-destructive cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Excluir</span>
                                </button>
                            </fetcher.Form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export default function Budget() {
    const { items } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [showAddBudget, setShowAddBudget] = useState(false);

    const totalEstimated = items.reduce((acc: any, curr: any) => acc + (Number(curr.estimated_value) || 0), 0);
    const totalPaid = items.reduce((acc: any, curr: any) => acc + (Number(curr.paid_value) || 0), 0);
    const progress = totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 0;

    // Dados para o gráfico de Pizza (Gastos por Categoria)
    const categoryData = items.reduce((acc: any, curr: any) => {
        const existing = acc.find((i: any) => i.name === curr.category);
        if (existing) {
            existing.value += Number(curr.paid_value) || 0;
        } else {
            acc.push({ name: curr.category, value: Number(curr.paid_value) || 0 });
        }
        return acc;
    }, []).filter((i: any) => i.value > 0);

    // Dados para o gráfico de Barras (Orçado vs Pago)
    const comparisonData = items.reduce((acc: any, curr: any) => {
        const existing = acc.find((i: any) => i.name === curr.category);
        if (existing) {
            existing.estimated += Number(curr.estimated_value) || 0;
            existing.paid += Number(curr.paid_value) || 0;
        } else {
            acc.push({
                name: curr.category,
                estimated: Number(curr.estimated_value) || 0,
                paid: Number(curr.paid_value) || 0
            });
        }
        return acc;
    }, []);

    // Filtrar itens
    const filteredItems = categoryFilter === "all"
        ? items
        : items.filter((item: any) => item.category === categoryFilter);

    // Lista única de categorias para o filtro
    const categories = Array.from(new Set(items.map((item: any) => item.category)));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    const handleExport = () => {
        const headers = ["Descrição", "Categoria", "Valor Orçado", "Valor Pago", "Status"];
        const csvContent = [
            headers.join(","),
            ...items.map((item: any) => [
                `"${item.description}"`,
                `"${item.category}"`,
                item.estimated_value,
                item.paid_value,
                item.status
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
        <div className="p-4 space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">Controle financeiro do casamento</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" /> Exportar
                </Button>
            </header>

            {/* Resumo Geral */}
            <Card className="bg-primary text-primary-foreground border-none">
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-sm opacity-90">Total Pago</p>
                            <div className="text-3xl font-bold">
                                {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs opacity-80">Orçado</p>
                            <p className="font-medium">
                                {totalEstimated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs opacity-90">
                            <span>Progresso</span>
                            <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white/90 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gráfico de Gastos por Categoria (Pizza) */}
                {categoryData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Distribuição de Gastos</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <div className="h-[200px] w-full max-w-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Gráfico Comparativo (Barras) */}
                {comparisonData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Orçado vs Pago</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                                        <Tooltip
                                            formatter={(value: any) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        />
                                        <Bar dataKey="estimated" name="Orçado" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="paid" name="Pago" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>



            {/* Filtros e Lista */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Itens do Orçamento</h3>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                            <Filter className="w-3 h-3 mr-2" />
                            <SelectValue placeholder="Filtrar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {categories.map((cat: any) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Nenhum item encontrado.
                        </div>
                    ) : (
                        filteredItems.map((item: any) => (
                            <BudgetItem key={item.id} item={item} submit={submit} />
                        ))
                    )}
                </div>
            </div>

            {/* FAB para Adicionar Gasto */}
            <div className="fixed bottom-24 right-6 z-50">
                <Button
                    onClick={() => setShowAddBudget(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Modal de Adicionar Gasto */}
            <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Gasto</DialogTitle>
                        <DialogDescription>
                            Adicione um novo item ao seu orçamento.
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" className="space-y-3" onSubmit={() => setShowAddBudget(false)}>
                        <Input name="description" placeholder="Descrição (ex: Buffet)" required />
                        <Input
                            name="category"
                            list="categories"
                            placeholder="Categoria (Selecione ou Digite)"
                            required
                            className="w-full"
                        />
                        <datalist id="categories">
                            <option value="Buffet" />
                            <option value="Decoração" />
                            <option value="Foto/Vídeo" />
                            <option value="Local" />
                            <option value="Roupas" />
                            <option value="Música" />
                            <option value="Cerimonial" />
                            <option value="Doces/Bolo" />
                            <option value="Papelaria" />
                            <option value="Outros" />
                        </datalist>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">R$</span>
                                <Input name="estimated_value" type="number" step="0.01" placeholder="Orçado" className="pl-8" />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">R$</span>
                                <Input name="paid_value" type="number" step="0.01" placeholder="Pago" className="pl-8" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddBudget(false)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="add">
                                Adicionar
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
        </div >
    );
}
