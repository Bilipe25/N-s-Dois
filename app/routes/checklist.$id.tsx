import { Form, useNavigation, useActionData, redirect, useLoaderData } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/checklist.$id";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Editar Tarefa - Nós Dois" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: task, error } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !task) {
        throw new Response("Tarefa não encontrada", { status: 404 });
    }

    return { task };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    const formData = await request.formData();
    const supabase = createClient(request);

    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const due_date = formData.get("due_date") as string;
    const assigned_to = formData.get("assigned_to") as string;

    if (!title) {
        return { error: "Título é obrigatório" };
    }

    const { error } = await supabase
        .from("checklist_items")
        .update({
            title,
            category,
            due_date: due_date || null,
            assigned_to: assigned_to || null
        })
        .eq("id", params.id);

    if (error) {
        return { error: error.message };
    }

    return redirect("/checklist");
};

export default function EditChecklistTask() {
    const { task } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    // Format date for input type="date" (YYYY-MM-DD)
    const defaultDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "";

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/checklist">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Editar Tarefa</h1>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Detalhes da Tarefa</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form method="post" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={task.title}
                                placeholder="Ex: Contratar Buffet"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Input
                                id="category"
                                name="category"
                                list="categories"
                                defaultValue={task.category}
                                placeholder="Selecione ou Digite"
                                required
                            />
                            <datalist id="categories">
                                <option value="Cerimônia" />
                                <option value="Festa" />
                                <option value="Documentação" />
                                <option value="Beleza" />
                                <option value="Lua de Mel" />
                                <option value="Convidados" />
                                <option value="Outros" />
                            </datalist>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due_date">Data de Vencimento</Label>
                            <Input
                                id="due_date"
                                name="due_date"
                                type="date"
                                defaultValue={defaultDate}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assigned_to">Responsável</Label>
                            <div className="relative">
                                <select
                                    id="assigned_to"
                                    name="assigned_to"
                                    defaultValue={task.assigned_to || ""}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                >
                                    <option value="">Sem responsável</option>
                                    <option value="noivo">Noivo</option>
                                    <option value="noiva">Noiva</option>
                                    <option value="ambos">Ambos</option>
                                </select>
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
