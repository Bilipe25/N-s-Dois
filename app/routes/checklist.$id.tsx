import { useLoaderData, Link, useNavigate, useParams } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { Route } from "./+types/checklist.$id";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateChecklistItemSchema, type UpdateChecklistItemInput } from "@/schemas/checklist";
import { useUpdateChecklistItem } from "@/hooks/useChecklist";
import { toast } from "sonner";

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

export default function EditChecklistTask() {
    const { task } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const params = useParams();
    const updateItem = useUpdateChecklistItem();

    const defaultDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "";

    const form = useForm<UpdateChecklistItemInput>({
        resolver: zodResolver(UpdateChecklistItemSchema),
        defaultValues: {
            title: task.title,
            category: task.category || "geral",
            due_date: defaultDate,
            assigned_to: task.assigned_to || "",
        }
    });

    const onSubmit = (data: UpdateChecklistItemInput) => {
        if (!params.id) return;

        updateItem.mutate({ id: params.id, ...data }, {
            onSuccess: () => {
                toast.success("Tarefa atualizada com sucesso!");
                navigate("/checklist");
            },
            onError: (error) => {
                toast.error(`Erro ao atualizar: ${error.message}`);
            }
        });
    };

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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                {...form.register("title")}
                                placeholder="Ex: Contratar Buffet"
                            />
                            {form.formState.errors.title && (
                                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Input
                                id="category"
                                {...form.register("category")}
                                list="categories"
                                placeholder="Selecione ou Digite"
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
                                type="date"
                                {...form.register("due_date")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assigned_to">Responsável</Label>
                            <div className="relative">
                                <select
                                    id="assigned_to"
                                    {...form.register("assigned_to")}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                >
                                    <option value="">Sem responsável</option>
                                    <option value="Gabriel">Gabriel (Noivo)</option>
                                    <option value="Raabe">Raabe (Noiva)</option>
                                    <option value="Ambos">Ambos</option>
                                </select>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={updateItem.isPending}>
                            {updateItem.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
