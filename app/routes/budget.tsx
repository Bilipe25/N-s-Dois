import { useLoaderData, Form } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign } from "lucide-react";
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
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("budget_items").delete().eq("id", id);
    }

    return null;
};

export default function Budget() {
    const { items } = useLoaderData<typeof loader>();

    const totalEstimated = items.reduce((acc: any, curr: any) => acc + (Number(curr.estimated_value) || 0), 0);
    const totalPaid = items.reduce((acc: any, curr: any) => acc + (Number(curr.paid_value) || 0), 0);
    const progress = totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 0;

    return (
        <div className="p-4 space-y-6 pb-20">
            <header>
                <h1 className="text-2xl font-serif text-primary">Orçamento</h1>
                <p className="text-sm text-muted-foreground">Controle financeiro do casamento</p>
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

            {/* Adicionar Gasto */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Novo Item</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <Form method="post" className="space-y-2">
                        <Input name="description" placeholder="Descrição (ex: Buffet)" required />
                        <div className="flex gap-2">
                            <select
                                name="category"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">Categoria...</option>
                                <option value="Buffet">Buffet</option>
                                <option value="Decoração">Decoração</option>
                                <option value="Foto/Vídeo">Foto/Vídeo</option>
                                <option value="Local">Local</option>
                                <option value="Roupas">Roupas</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">R$</span>
                                <Input name="estimated_value" type="number" step="0.01" placeholder="Orçado" className="pl-8" />
                            </div>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">R$</span>
                                <Input name="paid_value" type="number" step="0.01" placeholder="Pago" className="pl-8" />
                            </div>
                            <Button type="submit" name="intent" value="add" className="shrink-0">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </Form>
                </CardContent>
            </Card>

            {/* Lista de Gastos */}
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum item lançado.
                    </div>
                ) : (
                    items.map((item: any) => {
                        const itemProgress = item.estimated_value > 0 ? (item.paid_value / item.estimated_value) * 100 : 0;
                        return (
                            <div key={item.id} className="p-3 rounded-lg border bg-card border-border space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{item.description}</p>
                                        <p className="text-xs text-muted-foreground">{item.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">
                                            {Number(item.paid_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            de {Number(item.estimated_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${itemProgress >= 100 ? 'bg-green-500' : 'bg-primary'
                                            }`}
                                        style={{ width: `${Math.min(itemProgress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
