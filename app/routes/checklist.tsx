import { useState } from "react";
import { useLoaderData, Form, useSubmit } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calendar as CalendarIcon, User } from "lucide-react";
import type { Route } from "./+types/checklist";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Checklist - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: items, error } = await supabase
        .from("checklist_items")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching checklist:", error);
        return { items: [] };
    }

    return { items };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add") {
        const title = formData.get("title") as string;
        if (!title) return null;

        await supabase.from("checklist_items").insert({
            title,
            status: "pendente",
            assigned_to: "Ambos"
        });
    } else if (intent === "toggle") {
        const id = formData.get("id") as string;
        const currentStatus = formData.get("currentStatus") as string;
        const newStatus = currentStatus === "concluido" ? "pendente" : "concluido";

        await supabase.from("checklist_items").update({ status: newStatus }).eq("id", id);
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("checklist_items").delete().eq("id", id);
    }

    return null;
};

export default function Checklist() {
    const { items } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const [filter, setFilter] = useState<"todos" | "pendente" | "concluido">("todos");

    const filteredItems = items.filter((item: any) => {
        if (filter === "todos") return true;
        return item.status === filter;
    });

    const handleToggle = (id: string, currentStatus: string) => {
        const formData = new FormData();
        formData.append("intent", "toggle");
        formData.append("id", id);
        formData.append("currentStatus", currentStatus);
        submit(formData, { method: "post", replace: true });
    };

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-serif text-primary">Checklist</h1>
                    <div className="text-sm text-muted-foreground font-medium">
                        {Math.round((items.filter((i: any) => i.status === 'concluido').length / (items.length || 1)) * 100)}%
                    </div>
                </div>

                {/* Barra de Progresso */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(items.filter((i: any) => i.status === 'concluido').length / (items.length || 1)) * 100}%` }}
                    />
                </div>
            </header>

            {/* Filtros Simples */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {["todos", "pendente", "concluido"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filter === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Adicionar Tarefa Rápida */}
            <Card>
                <CardContent className="p-3">
                    <Form method="post" className="flex gap-2">
                        <Input name="title" placeholder="Nova tarefa..." className="border-0 shadow-none focus-visible:ring-0 px-2" required />
                        <Button type="submit" name="intent" value="add" size="sm" className="shrink-0">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </Form>
                </CardContent>
            </Card>

            {/* Lista de Tarefas */}
            <div className="space-y-2">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhuma tarefa encontrada.
                    </div>
                ) : (
                    filteredItems.map((item: any) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.status === 'concluido' ? 'bg-muted/50 border-transparent opacity-60' : 'bg-card border-border'
                                }`}
                        >
                            <div
                                onClick={() => handleToggle(item.id, item.status)}
                                className={`h-5 w-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${item.status === 'concluido' ? 'bg-primary border-primary text-primary-foreground' : 'border-input hover:bg-secondary'
                                    }`}
                            >
                                {item.status === 'concluido' && <Plus className="h-3 w-3 rotate-45" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${item.status === 'concluido' ? 'line-through' : ''}`}>
                                    {item.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                    {item.assigned_to && (
                                        <span className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded">
                                            <User className="h-3 w-3" /> {item.assigned_to}
                                        </span>
                                    )}
                                    {item.due_date && (
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" /> {new Date(item.due_date).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Form method="post">
                                <input type="hidden" name="id" value={item.id} />
                                <Button
                                    type="submit"
                                    name="intent"
                                    value="delete"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Form>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
