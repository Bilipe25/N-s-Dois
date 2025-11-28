import { Form, useNavigation, useActionData, redirect, useLoaderData } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/budget.$id";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Editar Item - Orçamento" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: item, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !item) {
        throw new Response("Item não encontrado", { status: 404 });
    }

    return { item };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    const formData = await request.formData();
    const supabase = createClient(request);

    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const estimated_value = parseFloat(formData.get("estimated_value") as string) || 0;
    const paid_value = parseFloat(formData.get("paid_value") as string) || 0;

    if (!description) {
        return { error: "Descrição é obrigatória" };
    }

    const status = paid_value >= estimated_value ? "pago" : paid_value > 0 ? "parcial" : "pendente";

    const { error } = await supabase
        .from("budget_items")
        .update({
            description,
            category,
            estimated_value,
            paid_value,
            status
        })
        .eq("id", params.id);

    if (error) {
        return { error: error.message };
    }

    return redirect("/budget");
};

export default function EditBudgetItem() {
    const { item } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/budget">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Editar Item</h1>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Detalhes do Item</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form method="post" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={item.description}
                                placeholder="Ex: Buffet"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Input
                                id="category"
                                name="category"
                                list="categories"
                                defaultValue={item.category}
                                placeholder="Selecione ou Digite"
                                required
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="estimated_value">Valor Orçado (R$)</Label>
                                <Input
                                    id="estimated_value"
                                    name="estimated_value"
                                    type="number"
                                    step="0.01"
                                    defaultValue={item.estimated_value}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paid_value">Valor Pago (R$)</Label>
                                <Input
                                    id="paid_value"
                                    name="paid_value"
                                    type="number"
                                    step="0.01"
                                    defaultValue={item.paid_value}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {actionData?.error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {actionData.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
