import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar as CalendarIcon, MoreHorizontal, ListPlus, Paperclip, Download, X, CheckCircle2, Circle, AlignLeft, Clock, ClipboardList } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
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

// Componente de Detalhes da Tarefa (Drawer)
function TaskDetailsDrawer({ item, open, onOpenChange }: { item: ChecklistItem, open: boolean, onOpenChange: (open: boolean) => void }) {
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

    const categoryColor = CATEGORIES.find(c => c.id === item.category)?.color || "bg-slate-100 text-slate-700";
    const subtasks = item.subtasks || [];
    const completedSubtasks = subtasks.filter((s: any) => s.done).length;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="text-left border-b pb-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                            <button onClick={handleToggleStatus} className="mt-1 focus:outline-none shrink-0">
                                {item.status === 'concluido' ? (
                                    <CheckCircle2 className="h-7 w-7 text-green-500" />
                                ) : (
                                    <Circle className="h-7 w-7 text-stone-300 hover:text-stone-500 transition-colors" />
                                )}
                            </button>
                            <div className="flex-1 min-w-0">
                                <Input
                                    defaultValue={item.title}
                                    className={`h-auto p-0 text-xl font-semibold border-none shadow-none focus-visible:ring-0 bg-transparent ${item.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}
                                    onBlur={handleUpdateTitle}
                                />
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge className={`${categoryColor} border-0`}>
                                        {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                                    </Badge>
                                    {item.due_date && (
                                        <Badge variant="outline" className="text-xs">
                                            <CalendarIcon className="h-3 w-3 mr-1" />
                                            {new Date(item.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </Badge>
                                    )}
                                    {subtasks.length > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                            <ListPlus className="h-3 w-3 mr-1" />
                                            {completedSubtasks}/{subtasks.length}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Categoria */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-500">Categoria</label>
                        <Select
                            defaultValue={item.category || "geral"}
                            onValueChange={handleUpdateCategory}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notas / Descrição */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-stone-500">
                            <AlignLeft className="h-4 w-4" />
                            Notas
                        </div>
                        <Textarea
                            defaultValue={item.notes || ""}
                            placeholder="Adicione detalhes, links ou observações..."
                            className="min-h-[100px] resize-none bg-stone-50 border-stone-200 focus:border-stone-400 focus:bg-white transition-all"
                            onBlur={handleUpdateNotes}
                        />
                    </div>

                    {/* Subtarefas */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm font-medium text-stone-500">
                            <div className="flex items-center gap-2">
                                <ListPlus className="h-4 w-4" />
                                Subtarefas
                            </div>
                            {subtasks.length > 0 && (
                                <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">
                                    {completedSubtasks}/{subtasks.length}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            {subtasks.map((sub: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 group p-2 bg-stone-50 rounded-lg">
                                    <button
                                        onClick={() => handleToggleSubtask(idx)}
                                        className={`h-5 w-5 rounded border flex items-center justify-center transition-colors shrink-0 ${sub.done ? 'bg-green-500 border-green-500 text-white' : 'border-stone-300 hover:border-stone-500'}`}
                                    >
                                        {sub.done && <CheckCircle2 className="h-3 w-3" />}
                                    </button>
                                    <span className={`text-sm flex-1 ${sub.done ? 'line-through text-stone-400' : ''}`}>
                                        {sub.title}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteSubtask(idx)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 p-2 border border-dashed border-stone-300 rounded-lg hover:bg-stone-50 transition-colors">
                                <Plus className="h-4 w-4 text-stone-400" />
                                <Input
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    placeholder="Adicionar item..."
                                    className="h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-stone-400"
                                />
                                <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs">Adicionar</Button>
                            </form>
                        </div>
                    </div>

                    {/* Anexos (Visualização apenas por enquanto) */}
                    {(item.attachments || []).length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-stone-500">
                                <Paperclip className="h-4 w-4" />
                                Anexos
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {(item.attachments || []).map((att: any, idx: number) => (
                                    <div key={idx} className="relative group border border-stone-200 rounded-lg p-2 flex items-center gap-2 bg-white hover:bg-stone-50 transition-colors">
                                        <div className="h-8 w-8 rounded bg-stone-100 flex items-center justify-center shrink-0">
                                            <Paperclip className="h-4 w-4 text-stone-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{att.name}</p>
                                            <p className="text-[10px] text-stone-400 uppercase">{att.type?.split('/')[1] || 'FILE'}</p>
                                        </div>
                                        <a href={att.url} download target="_blank" rel="noopener noreferrer" className="p-1 hover:text-blue-600">
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="text-xs text-stone-400 pt-2 border-t">
                        Criado em {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                </div>

                <DrawerFooter className="flex-row gap-2 border-t pt-4">
                    <Button
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleDeleteTask}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                    </Button>
                    <Button
                        className="flex-1 bg-stone-900 hover:bg-stone-800"
                        onClick={() => onOpenChange(false)}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Concluído
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
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

            {/* FAB para Adicionar Tarefa */}
            {!showAddTask && !selectedTask && (
                <div className="fixed bottom-safe-24 right-6 z-40">
                    <Button
                        onClick={() => setShowAddTask(true)}
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-stone-900 hover:bg-stone-800 text-white transition-transform hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {/* Drawer de Adicionar Tarefa */}
            <Drawer open={showAddTask} onOpenChange={setShowAddTask}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="text-left border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-stone-100">
                                <ClipboardList className="h-6 w-6 text-stone-600" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl">Nova Tarefa</DrawerTitle>
                                <DrawerDescription>O que precisamos resolver?</DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 py-4 space-y-4 overflow-y-auto">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Título</label>
                            <Input {...form.register("title")} placeholder="Ex: Contratar DJ" className="h-11" />
                            {form.formState.errors.title && (
                                <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700">Categoria</label>
                                <Select
                                    onValueChange={(val) => form.setValue("category", val)}
                                    defaultValue={form.getValues("category")}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700">Vencimento</label>
                                <Input {...form.register("due_date")} type="date" className="h-11" />
                            </div>
                        </div>

                        <DrawerFooter className="flex-row gap-2 px-0 pt-4 border-t">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddTask(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createItem.isPending} className="flex-1 bg-stone-900 hover:bg-stone-800">
                                {createItem.isPending ? "Adicionando..." : "Adicionar"}
                            </Button>
                        </DrawerFooter>
                    </form>
                </DrawerContent>
            </Drawer>

            {/* Drawer de Detalhes da Tarefa */}
            {selectedTask && (
                <TaskDetailsDrawer
                    item={selectedTask}
                    open={!!selectedTask}
                    onOpenChange={(open) => !open && setSelectedTask(null)}
                />
            )}
        </div>
    );
}
