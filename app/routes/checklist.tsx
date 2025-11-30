import { useState } from "react";
import { useLoaderData, Form, useSubmit, Link, useFetcher } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar as CalendarIcon, User, Pencil, MoreHorizontal, ArrowUpDown, ListPlus, Paperclip, Download, X, Loader2, CheckCircle2, Circle, Tag, AlignLeft, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
import type { Route } from "./+types/checklist";

const CATEGORIES = [
    { id: "geral", label: "Geral", color: "bg-slate-100 text-slate-700" },
    { id: "cerimonia", label: "Cerimônia", color: "bg-rose-100 text-rose-700" },
    { id: "recepcao", label: "Recepção/Festa", color: "bg-purple-100 text-purple-700" },
    { id: "roupas", label: "Roupas/Beleza", color: "bg-blue-100 text-blue-700" },
    { id: "documentacao", label: "Documentação", color: "bg-amber-100 text-amber-700" },
    { id: "lua_de_mel", label: "Lua de Mel", color: "bg-teal-100 text-teal-700" },
    { id: "convidados", label: "Convidados", color: "bg-indigo-100 text-indigo-700" },
];

const TASK_TEMPLATES = [
    { title: "Definir data do casamento", category: "geral" },
    { title: "Contratar Buffet", category: "recepcao" },
    { title: "Escolher Vestido de Noiva", category: "roupas" },
    { title: "Lista de Convidados", category: "convidados" },
    { title: "Contratar Fotógrafo", category: "recepcao" },
    { title: "Enviar Save the Date", category: "convidados" },
    { title: "Escolher Padrinhos", category: "cerimonia" },
    { title: "Definir Decoração", category: "recepcao" },
    { title: "Encomendar Bolo e Doces", category: "recepcao" },
    { title: "Escolher Músicas da Cerimônia", category: "cerimonia" },
];

export const meta: Route.MetaFunction = () => {
    return [{ title: "Checklist - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: items, error } = await supabase
        .from("checklist_items")
        .select("*")
        .order("due_date", { ascending: true }) // Ordenar por data para facilitar o agrupamento
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
        const category = formData.get("category") as string || "geral";

        if (!title) return null;

        await supabase.from("checklist_items").insert({
            title,
            status: "pendente",
            assigned_to: "Ambos",
            due_date,
            category,
            subtasks: []
        });
    } else if (intent === "update") {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;
        const due_date = formData.get("due_date") as string || null;
        const category = formData.get("category") as string;
        const notes = formData.get("notes") as string;

        await supabase.from("checklist_items").update({
            title,
            due_date,
            category,
            notes
        }).eq("id", id);

    } else if (intent === "toggle") {
        const id = formData.get("id") as string;
        const currentStatus = formData.get("currentStatus") as string;
        const newStatus = currentStatus === "concluido" ? "pendente" : "concluido";

        // Fetch task title for notification
        const { data: task } = await supabase
            .from("checklist_items")
            .select("title")
            .eq("id", id)
            .single();

        await supabase.from("checklist_items").update({ status: newStatus }).eq("id", id);

        // Create notification if task is completed
        if (newStatus === "concluido" && task) {
            await supabase.from("notifications").insert({
                type: "task",
                title: "Tarefa Concluída! ✅",
                message: `A tarefa "${task.title}" foi marcada como concluída.`,
                link: "/checklist"
            });
        }
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("checklist_items").delete().eq("id", id);
    } else if (intent === "add_subtask") {
        const id = formData.get("id") as string;
        const title = formData.get("subtask_title") as string;
        const subtasksJson = formData.get("subtasks_json") as string;
        const subtasks = JSON.parse(subtasksJson || "[]");

        if (title) {
            subtasks.push({ title, done: false });
            await supabase.from("checklist_items").update({ subtasks }).eq("id", id);
        }
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

// Componente de Detalhes da Tarefa (Dialog)
function TaskDetailsDialog({ item, open, onOpenChange }: any) {
    const fetcher = useFetcher();
    const subtasks = item.subtasks || [];
    const attachments = item.attachments || [];

    // Optimistic Updates
    let status = item.status;
    if (fetcher.formData?.get("intent") === "toggle" && fetcher.formData.get("id") === item.id) {
        status = status === "concluido" ? "pendente" : "concluido";
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl flex flex-col p-0 gap-0 overflow-hidden rounded-none sm:rounded-lg">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1">
                            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                <fetcher.Form method="post">
                                    <input type="hidden" name="intent" value="toggle" />
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="currentStatus" value={status} />
                                    <button type="submit" className="focus:outline-none">
                                        {status === 'concluido' ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                                        )}
                                    </button>
                                </fetcher.Form>
                                <fetcher.Form method="post" className="flex-1">
                                    <input type="hidden" name="intent" value="update" />
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="category" value={item.category || "geral"} />
                                    <input type="hidden" name="notes" value={item.notes || ""} />
                                    <input type="hidden" name="due_date" value={item.due_date || ""} />
                                    <Input
                                        name="title"
                                        defaultValue={item.title}
                                        className={`h-auto p-0 text-xl font-semibold border-none shadow-none focus-visible:ring-0 bg-transparent ${status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}
                                        onBlur={(e) => e.target.form?.requestSubmit()}
                                    />
                                </fetcher.Form>
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <fetcher.Form method="post">
                                    <input type="hidden" name="intent" value="update" />
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="title" value={item.title} />
                                    <input type="hidden" name="notes" value={item.notes || ""} />
                                    <input type="hidden" name="due_date" value={item.due_date || ""} />

                                    <Select
                                        name="category"
                                        defaultValue={item.category || "geral"}
                                        onValueChange={(value) => {
                                            const formData = new FormData();
                                            formData.append("intent", "update");
                                            formData.append("id", item.id);
                                            formData.append("title", item.title);
                                            formData.append("notes", item.notes || "");
                                            formData.append("due_date", item.due_date || "");
                                            formData.append("category", value);
                                            fetcher.submit(formData, { method: "post" });
                                        }}
                                    >
                                        <SelectTrigger className={`h-6 text-xs border-none px-2 capitalize w-fit gap-2 ${CATEGORIES.find(c => c.id === item.category)?.color || "bg-slate-100"}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </fetcher.Form>

                                {item.due_date && (
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {new Date(item.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => {
                                    // Implementar modo de edição se necessário, ou usar um form inline no dialog
                                    // Por simplicidade, vamos permitir editar campos básicos direto no dialog abaixo
                                }}>
                                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                    <fetcher.Form method="post">
                                        <input type="hidden" name="intent" value="delete" />
                                        <input type="hidden" name="id" value={item.id} />
                                        <button type="submit" className="text-destructive w-full text-left">Excluir Tarefa</button>
                                    </fetcher.Form>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    <div className="space-y-6">
                        {/* Notas / Descrição */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <AlignLeft className="h-4 w-4" />
                                Notas
                            </div>
                            <fetcher.Form method="post" className="w-full">
                                <input type="hidden" name="intent" value="update" />
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="title" value={item.title} />
                                <input type="hidden" name="due_date" value={item.due_date || ""} />
                                <input type="hidden" name="category" value={item.category || "geral"} />
                                <Textarea
                                    name="notes"
                                    defaultValue={item.notes || ""}
                                    placeholder="Adicione detalhes, links ou observações..."
                                    className="min-h-[100px] resize-none bg-secondary/20 border-transparent focus:border-primary focus:bg-background transition-all"
                                    onBlur={(e) => e.target.form?.requestSubmit()}
                                />
                            </fetcher.Form>
                        </div>

                        {/* Subtarefas */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <ListPlus className="h-4 w-4" />
                                    Subtarefas
                                </div>
                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                    {subtasks.filter((s: any) => s.done).length}/{subtasks.length}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {subtasks.map((sub: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <fetcher.Form method="post" className="flex-1 flex items-center gap-3">
                                            <input type="hidden" name="intent" value="toggle_subtask" />
                                            <input type="hidden" name="id" value={item.id} />
                                            <input type="hidden" name="subtask_idx" value={idx} />
                                            <input type="hidden" name="subtasks_json" value={JSON.stringify(subtasks)} />
                                            <button
                                                type="submit"
                                                className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${sub.done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 hover:border-primary'}`}
                                            >
                                                {sub.done && <Plus className="h-3 w-3 rotate-45" />}
                                            </button>
                                            <span className={`text-sm ${sub.done ? 'line-through text-muted-foreground' : ''}`}>
                                                {sub.title}
                                            </span>
                                        </fetcher.Form>
                                        <fetcher.Form method="post">
                                            <input type="hidden" name="intent" value="delete_subtask" />
                                            <input type="hidden" name="id" value={item.id} />
                                            <input type="hidden" name="subtask_idx" value={idx} />
                                            <input type="hidden" name="subtasks_json" value={JSON.stringify(subtasks)} />
                                            <button type="submit" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </fetcher.Form>
                                    </div>
                                ))}

                                <fetcher.Form method="post" className="flex items-center gap-2 mt-3 p-2 border border-dashed rounded-md hover:bg-secondary/50 transition-colors" onSubmit={(e) => {
                                    const form = e.currentTarget;
                                    requestAnimationFrame(() => form.reset());
                                }}>
                                    <input type="hidden" name="intent" value="add_subtask" />
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="subtasks_json" value={JSON.stringify(subtasks)} />
                                    <Plus className="h-4 w-4 text-primary" />
                                    <Input
                                        name="subtask_title"
                                        placeholder="Adicionar item..."
                                        className="h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground"
                                    />
                                    <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs">Adicionar</Button>
                                </fetcher.Form>
                            </div>
                        </div>

                        {/* Anexos */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Paperclip className="h-4 w-4" />
                                Anexos
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {attachments.map((att: any, idx: number) => (
                                    <div key={idx} className="relative group border rounded-lg p-2 flex items-center gap-2 bg-card hover:bg-secondary/50 transition-colors">
                                        <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{att.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{att.type?.split('/')[1] || 'FILE'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1 bottom-1 justify-center bg-background/80 backdrop-blur-sm rounded px-1">
                                            <a href={att.url} download target="_blank" rel="noopener noreferrer" className="p-1 hover:text-primary">
                                                <Download className="h-3 w-3" />
                                            </a>
                                            <fetcher.Form method="post">
                                                <input type="hidden" name="intent" value="delete_attachment" />
                                                <input type="hidden" name="id" value={item.id} />
                                                <input type="hidden" name="url" value={att.url} />
                                                <input type="hidden" name="current_attachments" value={JSON.stringify(attachments)} />
                                                <button type="submit" className="p-1 hover:text-destructive">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </fetcher.Form>
                                        </div>
                                    </div>
                                ))}

                                <fetcher.Form method="post" encType="multipart/form-data" className="border border-dashed rounded-lg p-2 flex items-center justify-center gap-2 hover:bg-secondary/50 transition-colors cursor-pointer relative h-[52px]">
                                    <input type="hidden" name="intent" value="upload_attachment" />
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="current_attachments" value={JSON.stringify(attachments)} />
                                    <input
                                        type="file"
                                        name="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => e.target.form?.requestSubmit()}
                                    />
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Adicionar</span>
                                </fetcher.Form>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-secondary/10">
                    <div className="flex justify-between w-full items-center">
                        <div className="text-xs text-muted-foreground">
                            Criado em {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        <Button className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                            Concluído
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Componente de Card da Tarefa (Novo Design)
function TaskCard({ item, onClick }: any) {
    const fetcher = useFetcher();

    // Optimistic Status
    let status = item.status;
    if (fetcher.formData?.get("intent") === "toggle" && fetcher.formData.get("id") === item.id) {
        status = status === "concluido" ? "pendente" : "concluido";
    }

    const isDeleting = fetcher.formData?.get("intent") === "delete" && fetcher.formData.get("id") === item.id;
    if (isDeleting) return null;

    const categoryColor = CATEGORIES.find(c => c.id === item.category)?.color || "bg-slate-100 text-slate-700";
    const subtasks = item.subtasks || [];
    const completedSubtasks = subtasks.filter((s: any) => s.done).length;

    return (
        <div
            className={`group relative bg-card border rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 max-w-full ${status === 'concluido' ? 'opacity-60 bg-secondary/20' : ''}`}
        >
            <div className="flex items-start gap-3">
                <fetcher.Form method="post" onClick={(e) => e.stopPropagation()}>
                    <input type="hidden" name="intent" value="toggle" />
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="currentStatus" value={status} />
                    <button
                        type="submit"
                        className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${status === 'concluido' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 hover:border-primary'}`}
                    >
                        {status === 'concluido' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                </fetcher.Form>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
                    <div className="flex flex-col gap-1">
                        <span className={`text-sm font-medium break-words ${status === 'concluido' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.title}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${categoryColor}`}>
                                {CATEGORIES.find(c => c.id === item.category)?.label || "Geral"}
                            </span>

                            {item.due_date && (
                                <span className={`text-[10px] flex items-center gap-1 ${new Date(item.due_date) < new Date() && status !== 'concluido' ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                    <Clock className="h-3 w-3" />
                                    {new Date(item.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </span>
                            )}

                            {subtasks.length > 0 && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <ListPlus className="h-3 w-3" />
                                    {completedSubtasks}/{subtasks.length}
                                </span>
                            )}

                            {item.attachments?.length > 0 && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    {item.attachments.length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Checklist() {
    const { items } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const [filter, setFilter] = useState<"todos" | "pendente" | "concluido">("todos");
    const [showAddTask, setShowAddTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // Filtragem
    const filteredItems = items.filter((item: any) => {
        if (filter === "todos") return true;
        return item.status === filter;
    });

    // Agrupamento por Mês e Categoria
    const groupedItems = filteredItems.reduce((acc: any, item: any) => {
        const date = item.due_date ? new Date(item.due_date + 'T12:00:00') : null;
        const monthKey = date
            ? date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : "Sem Data";

        // Ordenação cronológica das chaves de mês é complexa em objeto, vamos usar array depois
        // Mas para simplificar a chave de ordenação:
        const sortKey = date ? date.toISOString().slice(0, 7) : "9999-99"; // Sem data vai pro fim

        if (!acc[sortKey]) {
            acc[sortKey] = { label: monthKey, categories: {} };
        }

        const category = item.category || "geral";
        if (!acc[sortKey].categories[category]) {
            acc[sortKey].categories[category] = [];
        }

        acc[sortKey].categories[category].push(item);
        return acc;
    }, {});

    // Ordenar chaves de mês
    const sortedMonths = Object.keys(groupedItems).sort();

    const handleAddTemplate = (template: { title: string, category: string }) => {
        const formData = new FormData();
        formData.append("intent", "add");
        formData.append("title", template.title);
        formData.append("category", template.category);
        submit(formData, { method: "post", replace: true });
    };

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                    <div>
                        {/* <h1 className="text-2xl font-serif text-primary">Checklist</h1> */}
                        <p className="text-sm text-muted-foreground">Organize cada detalhe do grande dia.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                            {Math.round((items.filter((i: any) => i.status === 'concluido').length / (items.length || 1)) * 100)}%
                        </div>
                        <span className="text-xs text-muted-foreground">Concluído</span>
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

            {/* Filtros e Ações */}
            <div className="flex flex-col gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-4 px-4 border-b">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sugestões Rápidas</DropdownMenuLabel>
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

            {/* Lista Agrupada */}
            <div className="space-y-8">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-3 opacity-50">
                        <ListPlus className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">Nenhuma tarefa encontrada.</p>
                    </div>
                ) : (
                    sortedMonths.map((monthKey) => {
                        const monthGroup = groupedItems[monthKey];
                        return (
                            <div key={monthKey} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                    <h2 className="font-semibold text-lg capitalize text-foreground/80">
                                        {monthGroup.label}
                                    </h2>
                                    <div className="h-px bg-border flex-1" />
                                </div>

                                <div className="space-y-4 pl-2">
                                    {Object.keys(monthGroup.categories).map((catId) => (
                                        <div key={catId} className="space-y-2">
                                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
                                                {CATEGORIES.find(c => c.id === catId)?.label || catId}
                                            </h3>
                                            <div className="grid gap-2">
                                                {monthGroup.categories[catId].map((item: any) => (
                                                    <TaskCard
                                                        key={item.id}
                                                        item={item}
                                                        onClick={() => setSelectedTask(item)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-50">
                <Button
                    onClick={() => setShowAddTask(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105 active:scale-95"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Dialog de Adicionar */}
            <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Tarefa</DialogTitle>
                        <DialogDescription>
                            O que precisamos resolver?
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" className="space-y-4" onSubmit={() => setShowAddTask(false)}>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Título</label>
                                <Input name="title" placeholder="Ex: Contratar DJ" required />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                    <Select name="category" defaultValue="geral">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Vencimento</label>
                                    <Input name="due_date" type="date" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddTask(false)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="add">
                                Adicionar
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Dialog de Detalhes */}
            {selectedTask && (
                <TaskDetailsDialog
                    item={selectedTask}
                    open={!!selectedTask}
                    onOpenChange={(open: boolean) => !open && setSelectedTask(null)}
                />
            )}
        </div>
    );
}
