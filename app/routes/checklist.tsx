import { useState } from "react";
import { useLoaderData, Form, useSubmit, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calendar as CalendarIcon, User, Pencil, MoreHorizontal, ArrowUpDown, ListPlus, Paperclip, Download, X, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Route } from "./+types/checklist";

const TASK_TEMPLATES = [
    { title: "Definir data do casamento", due_date: null },
    { title: "Contratar Buffet", due_date: null },
    { title: "Escolher Vestido de Noiva", due_date: null },
    { title: "Lista de Convidados", due_date: null },
    { title: "Contratar Fotógrafo", due_date: null },
    { title: "Enviar Save the Date", due_date: null },
    { title: "Escolher Padrinhos", due_date: null },
    { title: "Definir Decoração", due_date: null },
    { title: "Encomendar Bolo e Doces", due_date: null },
    { title: "Escolher Músicas da Cerimônia", due_date: null },
];

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
        const due_date = formData.get("due_date") as string || null;
        if (!title) return null;

        await supabase.from("checklist_items").insert({
            title,
            status: "pendente",
            assigned_to: "Ambos",
            due_date,
            subtasks: []
        });
    } else if (intent === "toggle") {
        const id = formData.get("id") as string;
        const currentStatus = formData.get("currentStatus") as string;
        const newStatus = currentStatus === "concluido" ? "pendente" : "concluido";

        await supabase.from("checklist_items").update({ status: newStatus }).eq("id", id);
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("checklist_items").delete().eq("id", id);
    } else if (intent === "add_subtask") {
        const id = formData.get("id") as string;
        const title = formData.get("subtask_title") as string;
        const subtasksJson = formData.get("subtasks_json") as string;
        const subtasks = JSON.parse(subtasksJson || "[]");

        subtasks.push({ title, done: false });

        await supabase.from("checklist_items").update({ subtasks }).eq("id", id);
    } else if (intent === "toggle_subtask") {
        const id = formData.get("id") as string;
        const idx = parseInt(formData.get("subtask_idx") as string);
        const subtasksJson = formData.get("subtasks_json") as string;
        const subtasks = JSON.parse(subtasksJson || "[]");

        if (subtasks[idx]) {
            subtasks[idx].done = !subtasks[idx].done;
            await supabase.from("checklist_items").update({ subtasks }).eq("id", id);
        }
    } else if (intent === "delete_subtask") {
        const id = formData.get("id") as string;
        const idx = parseInt(formData.get("subtask_idx") as string);
        const subtasksJson = formData.get("subtasks_json") as string;
        const subtasks = JSON.parse(subtasksJson || "[]");

        subtasks.splice(idx, 1);
        await supabase.from("checklist_items").update({ subtasks }).eq("id", id);
    } else if (intent === "upload_attachment") {
        const id = formData.get("id") as string;
        const file = formData.get("file") as File;
        const currentAttachmentsJson = formData.get("current_attachments") as string;
        const currentAttachments = JSON.parse(currentAttachmentsJson || "[]");

        if (file && file.size > 0 && file.name !== "undefined") {
            const fileExt = file.name.split('.').pop();
            const fileName = `checklist_${id}_${Date.now()}.${fileExt}`;

            const arrayBuffer = await file.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(fileName, fileBuffer, {
                    contentType: file.type,
                    upsert: true
                });

            if (!uploadError) {
                const { data } = supabase.storage
                    .from("images")
                    .getPublicUrl(fileName);

                currentAttachments.push({
                    name: file.name,
                    url: data.publicUrl,
                    type: file.type,
                    size: file.size,
                    created_at: new Date().toISOString()
                });

                await supabase.from("checklist_items").update({ attachments: currentAttachments }).eq("id", id);
            }
        }
    } else if (intent === "delete_attachment") {
        const id = formData.get("id") as string;
        const urlToDelete = formData.get("url") as string;
        const currentAttachmentsJson = formData.get("current_attachments") as string;
        let currentAttachments = JSON.parse(currentAttachmentsJson || "[]");

        currentAttachments = currentAttachments.filter((att: any) => att.url !== urlToDelete);

        await supabase.from("checklist_items").update({ attachments: currentAttachments }).eq("id", id);
    }

    return null;
};

export default function Checklist() {
    const { items } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const [filter, setFilter] = useState<"todos" | "pendente" | "concluido">("todos");
    const [sortOrder, setSortOrder] = useState<"urgency" | "recent" | "alpha">("urgency");
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const filteredItems = items.filter((item: any) => {
        if (filter === "todos") return true;
        return item.status === filter;
    });

    // Ordenação
    filteredItems.sort((a: any, b: any) => {
        // Concluídos sempre no final
        if (a.status === 'concluido' && b.status !== 'concluido') return 1;
        if (a.status !== 'concluido' && b.status === 'concluido') return -1;

        if (sortOrder === "urgency") {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        } else if (sortOrder === "recent") {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortOrder === "alpha") {
            return a.title.localeCompare(b.title);
        }
        return 0;
    });

    const handleAddTemplate = (template: { title: string, due_date: string | null }) => {
        const formData = new FormData();
        formData.append("intent", "add");
        formData.append("title", template.title);
        if (template.due_date) formData.append("due_date", template.due_date);
        submit(formData, { method: "post", replace: true });
    };

    const handleToggle = (id: string, currentStatus: string) => {
        const formData = new FormData();
        formData.append("intent", "toggle");
        formData.append("id", id);
        formData.append("currentStatus", currentStatus);
        submit(formData, { method: "post", replace: true });
    };

    const toggleExpand = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const isOverdue = (dateString: string) => {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateString);
        return due < today;
    };

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex flex-col gap-4">
                <div className="flex justify-end items-center">
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

            {/* Controles: Filtros, Ordenação e Templates */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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
                </div>

                <div className="flex justify-between items-center gap-2">
                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                        <SelectTrigger className="h-8 text-xs w-[130px]">
                            <ArrowUpDown className="w-3 h-3 mr-2" />
                            <SelectValue placeholder="Ordenar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="urgency">Mais Urgentes</SelectItem>
                            <SelectItem value="recent">Recentes</SelectItem>
                            <SelectItem value="alpha">A-Z</SelectItem>
                        </SelectContent>
                    </Select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <ListPlus className="w-3 h-3 mr-2" />
                                Sugestões
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
                            <DropdownMenuLabel>Tarefas Sugeridas</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {TASK_TEMPLATES.map((template, idx) => (
                                <DropdownMenuItem key={idx} onClick={() => handleAddTemplate(template)}>
                                    {template.title}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Adicionar Tarefa Rápida */}
            <Card>
                <CardContent className="p-3">
                    <Form method="post" className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Input name="title" placeholder="Nova tarefa..." className="border-0 shadow-none focus-visible:ring-0 px-2 flex-1" required />
                            <Input name="due_date" type="date" className="w-36 border-0 shadow-none focus-visible:ring-0 text-xs" />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" name="intent" value="add" size="sm" className="h-7 text-xs">
                                <Plus className="h-3 w-3 mr-1" /> Adicionar
                            </Button>
                        </div>
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
                    filteredItems.map((item: any) => {
                        const overdue = item.status !== 'concluido' && isOverdue(item.due_date);
                        const subtasks = item.subtasks || [];
                        const completedSubtasks = subtasks.filter((s: any) => s.done).length;

                        return (
                            <div
                                key={item.id}
                                className={`flex flex-col p-3 rounded-lg border transition-all ${item.status === 'concluido' ? 'bg-muted/50 border-transparent opacity-60' : 'bg-card border-border'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        onClick={() => handleToggle(item.id, item.status)}
                                        className={`h-5 w-5 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${item.status === 'concluido' ? 'bg-primary border-primary text-primary-foreground' : 'border-input hover:bg-secondary'
                                            }`}
                                    >
                                        {item.status === 'concluido' && <Plus className="h-3 w-3 rotate-45" />}
                                    </div>

                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm font-medium truncate ${item.status === 'concluido' ? 'line-through' : ''}`}>
                                                {item.title}
                                            </p>
                                            {item.due_date && (
                                                <span className={`flex items-center gap-1 text-[10px] whitespace-nowrap ml-2 ${overdue ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {new Date(item.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                            {subtasks.length > 0 && (
                                                <span className="bg-secondary px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    {completedSubtasks}/{subtasks.length} sub-tarefas
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link to={`/checklist/${item.id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                                    <Pencil className="h-4 w-4" />
                                                    <span>Editar</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Form method="post" className="w-full flex">
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
                                                </Form>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Subtarefas (Expandido) */}
                                {expandedItems.includes(item.id) && (
                                    <div className="mt-3 pl-8 space-y-2 border-l-2 border-secondary ml-2.5">
                                        {subtasks.map((sub: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <Form method="post" className="flex items-center gap-2 flex-1">
                                                    <input type="hidden" name="id" value={item.id} />
                                                    <input type="hidden" name="subtask_idx" value={idx} />
                                                    <input type="hidden" name="subtasks_json" value={JSON.stringify(subtasks)} />
                                                    <button
                                                        type="submit"
                                                        name="intent"
                                                        value="toggle_subtask"
                                                        className={`h-4 w-4 rounded border flex items-center justify-center ${sub.done ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}
                                                    >
                                                        {sub.done && <Plus className="h-2 w-2 rotate-45" />}
                                                    </button>
                                                    <span className={sub.done ? 'line-through text-muted-foreground' : ''}>{sub.title}</span>
                                                </Form>
                                                <Form method="post">
                                                    <input type="hidden" name="id" value={item.id} />
                                                    <input type="hidden" name="subtask_idx" value={idx} />
                                                    <input type="hidden" name="subtasks_json" value={JSON.stringify(subtasks)} />
                                                    <button type="submit" name="intent" value="delete_subtask" className="text-destructive opacity-50 hover:opacity-100">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </Form>
                                            </div>
                                        ))}

                                        <Form method="post" className="flex gap-2 mt-2">
                                            <input type="hidden" name="id" value={item.id} />
                                            <input type="hidden" name="subtasks_json" value={JSON.stringify(subtasks)} />
                                            <Input name="subtask_title" placeholder="Nova subtarefa..." className="h-7 text-xs" required />
                                            <Button type="submit" name="intent" value="add_subtask" size="sm" className="h-7 w-7 p-0">
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </Form>

                                        {/* Anexos */}
                                        <div className="mt-4 pt-2 border-t border-border/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Paperclip className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">Anexos</span>
                                            </div>

                                            <div className="space-y-2">
                                                {(item.attachments || []).map((att: any, attIdx: number) => (
                                                    <div key={attIdx} className="flex items-center justify-between bg-secondary/30 p-2 rounded text-xs group">
                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline truncate flex-1">
                                                            <span className="truncate max-w-[150px]">{att.name}</span>
                                                        </a>
                                                        <div className="flex items-center gap-2">
                                                            <a href={att.url} download target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                                                <Download className="h-3 w-3" />
                                                            </a>
                                                            <Form method="post">
                                                                <input type="hidden" name="id" value={item.id} />
                                                                <input type="hidden" name="url" value={att.url} />
                                                                <input type="hidden" name="current_attachments" value={JSON.stringify(item.attachments || [])} />
                                                                <button type="submit" name="intent" value="delete_attachment" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Form>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <Form method="post" encType="multipart/form-data" className="mt-2">
                                                <input type="hidden" name="id" value={item.id} />
                                                <input type="hidden" name="current_attachments" value={JSON.stringify(item.attachments || [])} />
                                                <div className="flex items-center gap-2">
                                                    <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors">
                                                        <Paperclip className="h-3 w-3" />
                                                        Adicionar Anexo
                                                        <input
                                                            type="file"
                                                            name="file"
                                                            className="hidden"
                                                            onChange={(e) => e.target.form?.requestSubmit()}
                                                        />
                                                    </label>
                                                    <input type="hidden" name="intent" value="upload_attachment" />
                                                </div>
                                            </Form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
