import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar as CalendarIcon, MoreHorizontal, ListPlus, Paperclip, Download, X, CheckCircle2, Circle, AlignLeft, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Route } from "./+types/checklist";
import { useChecklist, useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from "@/hooks/useChecklist";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateChecklistItemSchema, type CreateChecklistItemInput, type ChecklistItem } from "@/schemas/checklist";
import { toast } from "sonner";

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
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching checklist:", error);
        return { items: [] };
    }

    return { items };
};

// Componente de Detalhes da Tarefa (Dialog)
function TaskDetailsDialog({ item, open, onOpenChange }: { item: ChecklistItem, open: boolean, onOpenChange: (open: boolean) => void }) {
    const updateItem = useUpdateChecklistItem();
    const deleteItem = useDeleteChecklistItem();
    const [newSubtask, setNewSubtask] = useState("");

    const handleToggleStatus = () => {
        const newStatus = item.status === "concluido" ? "pendente" : "concluido";
        updateItem.mutate({ id: item.id, status: newStatus });
    };

    const handleUpdateTitle = (e: React.FocusEvent<HTMLInputElement>) => {
        if (e.target.value !== item.title) {
            updateItem.mutate({ id: item.id, title: e.target.value });
        }
    };

    const handleUpdateNotes = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (e.target.value !== item.notes) {
            updateItem.mutate({ id: item.id, notes: e.target.value });
        }
    };

    const handleUpdateCategory = (value: string) => {
        updateItem.mutate({ id: item.id, category: value });
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtask.trim()) return;

        const currentSubtasks = item.subtasks || [];
        const updatedSubtasks = [...currentSubtasks, { title: newSubtask, done: false }];
        updateItem.mutate({ id: item.id, subtasks: updatedSubtasks });
        setNewSubtask("");
    };

    const handleToggleSubtask = (idx: number) => {
        const currentSubtasks = [...(item.subtasks || [])];
        currentSubtasks[idx].done = !currentSubtasks[idx].done;
        updateItem.mutate({ id: item.id, subtasks: currentSubtasks });
    };

    const handleDeleteSubtask = (idx: number) => {
        const currentSubtasks = [...(item.subtasks || [])];
        currentSubtasks.splice(idx, 1);
        updateItem.mutate({ id: item.id, subtasks: currentSubtasks });
    };

    const handleDeleteTask = () => {
        if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
            deleteItem.mutate(item.id);
            onOpenChange(false);
        }
    };

    // Anexos seriam implementados aqui com lógica similar, mas requer upload de arquivo que é mais complexo para este exemplo rápido.
    // Mantendo a UI de anexos como readonly ou placeholder por enquanto para focar na refatoração principal.

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl flex flex-col p-0 gap-0 overflow-hidden rounded-none sm:rounded-lg">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1">
                            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                <button onClick={handleToggleStatus} className="focus:outline-none">
                                    {item.status === 'concluido' ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                                    )}
                                </button>
                                <Input
                                    defaultValue={item.title}
                                    className={`h-auto p-0 text-xl font-semibold border-none shadow-none focus-visible:ring-0 bg-transparent ${item.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}
                                    onBlur={handleUpdateTitle}
                                />
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Select
                                    defaultValue={item.category || "geral"}
                                    onValueChange={handleUpdateCategory}
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
                                <DropdownMenuItem onClick={handleDeleteTask}>
                                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                    <span className="text-destructive">Excluir Tarefa</span>
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
                            <Textarea
                                defaultValue={item.notes || ""}
                                placeholder="Adicione detalhes, links ou observações..."
                                className="min-h-[100px] resize-none bg-secondary/20 border-transparent focus:border-primary focus:bg-background transition-all"
                                onBlur={handleUpdateNotes}
                            />
                        </div>

                        {/* Subtarefas */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <ListPlus className="h-4 w-4" />
                                    Subtarefas
                                </div>
                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                    {(item.subtasks || []).filter((s: any) => s.done).length}/{(item.subtasks || []).length}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {(item.subtasks || []).map((sub: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <button
                                            onClick={() => handleToggleSubtask(idx)}
                                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${sub.done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 hover:border-primary'}`}
                                        >
                                            {sub.done && <Plus className="h-3 w-3 rotate-45" />}
                                        </button>
                                        <span className={`text-sm flex-1 ${sub.done ? 'line-through text-muted-foreground' : ''}`}>
                                            {sub.title}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSubtask(idx)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}

                                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-3 p-2 border border-dashed rounded-md hover:bg-secondary/50 transition-colors">
                                    <Plus className="h-4 w-4 text-primary" />
                                    <Input
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        placeholder="Adicionar item..."
                                        className="h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground"
                                    />
                                    <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs">Adicionar</Button>
                                </form>
                            </div>
                        </div>

                        {/* Anexos (Visualização apenas por enquanto) */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Paperclip className="h-4 w-4" />
                                Anexos
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {(item.attachments || []).map((att: any, idx: number) => (
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
                                        </div>
                                    </div>
                                ))}
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

// Componente de Card da Tarefa
function TaskCard({ item, onClick }: { item: ChecklistItem, onClick: () => void }) {
    const updateItem = useUpdateChecklistItem();

    const handleToggleStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = item.status === "concluido" ? "pendente" : "concluido";
        updateItem.mutate({ id: item.id, status: newStatus });
    };

    const categoryColor = CATEGORIES.find(c => c.id === item.category)?.color || "bg-slate-100 text-slate-700";
    const subtasks = item.subtasks || [];
    const completedSubtasks = subtasks.filter((s: any) => s.done).length;

    return (
        <div
            className={`group relative bg-card border rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 max-w-full ${item.status === 'concluido' ? 'opacity-60 bg-secondary/20' : ''}`}
        >
            <div className="flex items-start gap-3">
                <button
                    onClick={handleToggleStatus}
                    className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.status === 'concluido' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 hover:border-primary'}`}
                >
                    {item.status === 'concluido' && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
                    <div className="flex flex-col gap-1">
                        <span className={`text-sm font-medium break-words ${item.status === 'concluido' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.title}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${categoryColor}`}>
                                {CATEGORIES.find(c => c.id === item.category)?.label || "Geral"}
                            </span>

                            {item.due_date && (
                                <span className={`text-[10px] flex items-center gap-1 ${new Date(item.due_date) < new Date() && item.status !== 'concluido' ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
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
    const { items: initialItems } = useLoaderData<typeof loader>();
    const { data: items = [] } = useChecklist(initialItems as any);
    const createItem = useCreateChecklistItem();

    const [filter, setFilter] = useState<"todos" | "pendente" | "concluido">("todos");
    const [showAddTask, setShowAddTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ChecklistItem | null>(null);

    // Form de criação
    const form = useForm<CreateChecklistItemInput>({
        resolver: zodResolver(CreateChecklistItemSchema),
        defaultValues: {
            title: "",
            category: "geral",
            due_date: undefined,
        }
    });

    const onSubmit = (data: CreateChecklistItemInput) => {
        createItem.mutate(data, {
            onSuccess: () => {
                setShowAddTask(false);
                form.reset();
            }
        });
    };

    const handleAddTemplate = (template: { title: string, category: string }) => {
        createItem.mutate({ title: template.title, category: template.category });
    };

    // Filtragem
    const filteredItems = items.filter((item) => {
        if (filter === "todos") return true;
        return item.status === filter;
    });

    // Agrupamento
    const groupedItems = filteredItems.reduce((acc: any, item) => {
        const date = item.due_date ? new Date(item.due_date + 'T12:00:00') : null;
        const monthKey = date
            ? date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : "Sem Data";

        const sortKey = date ? date.toISOString().slice(0, 7) : "9999-99";

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

    const sortedMonths = Object.keys(groupedItems).sort();

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-sm text-muted-foreground">Organize cada detalhe do grande dia.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                            {Math.round((items.filter((i) => i.status === 'concluido').length / (items.length || 1)) * 100)}%
                        </div>
                        <span className="text-xs text-muted-foreground">Concluído</span>
                    </div>
                </div>

                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(items.filter((i) => i.status === 'concluido').length / (items.length || 1)) * 100}%` }}
                    />
                </div>
            </header>

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
                                                {monthGroup.categories[catId].map((item: ChecklistItem) => (
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

            <div className="fixed bottom-24 right-6 z-50">
                <Button
                    onClick={() => setShowAddTask(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105 active:scale-95"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Tarefa</DialogTitle>
                        <DialogDescription>
                            O que precisamos resolver?
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Título</label>
                                <Input {...form.register("title")} placeholder="Ex: Contratar DJ" />
                                {form.formState.errors.title && (
                                    <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                    <Select
                                        onValueChange={(val) => form.setValue("category", val)}
                                        defaultValue={form.getValues("category")}
                                    >
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
                                    <Input {...form.register("due_date")} type="date" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddTask(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createItem.isPending}>
                                {createItem.isPending ? "Adicionando..." : "Adicionar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {selectedTask && (
                <TaskDetailsDialog
                    item={selectedTask}
                    open={!!selectedTask}
                    onOpenChange={(open) => !open && setSelectedTask(null)}
                />
            )}
        </div>
    );
}
