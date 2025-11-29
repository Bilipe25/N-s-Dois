import { useState } from "react";
import { useLoaderData, Form, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Plus, Users, Check, X, MoreHorizontal, Trash2, Pencil, MessageCircle, Upload, PieChart as PieChartIcon, BarChart as BarChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { Route } from "./+types/guests";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Convidados - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: guests, error } = await supabase
        .from("guests")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching guests:", error);
        return { guests: [] };
    }

    return { guests };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add") {
        const name = formData.get("name") as string;
        const group_name = formData.get("group_name") as string;
        const adults_count = parseInt(formData.get("adults_count") as string) || 1;
        const children_count = parseInt(formData.get("children_count") as string) || 0;

        if (!name) return null;

        await supabase.from("guests").insert({
            name,
            group_name,
            adults_count,
            children_count,
            rsvp_status: "pendente"
        });
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("guests").delete().eq("id", id);
    } else if (intent === "rsvp_action") {
        const id = formData.get("id") as string;
        const status = formData.get("status") as string;

        // Fetch guest name for notification
        const { data: guest } = await supabase
            .from("guests")
            .select("name")
            .eq("id", id)
            .single();

        await supabase.from("guests").update({ rsvp_status: status }).eq("id", id);

        // Create notification
        if (guest) {
            await supabase.from("notifications").insert({
                type: "rsvp",
                title: "Atualização de RSVP 📩",
                message: `${guest.name} teve a presença marcada como "${status}".`,
                link: "/guests"
            });
        }
    } else if (intent === "bulk_import") {
        const csvData = formData.get("csv_data") as string;
        if (!csvData) return null;

        const lines = csvData.split("\n");
        const guestsToInsert = [];

        for (const line of lines) {
            const [name, group_name, adults_count, children_count] = line.split(",").map(s => s.trim());
            if (name) {
                guestsToInsert.push({
                    name,
                    group_name: group_name || "Outros",
                    adults_count: parseInt(adults_count) || 1,
                    children_count: parseInt(children_count) || 0,
                    rsvp_status: "pendente"
                });
            }
        }

        if (guestsToInsert.length > 0) {
            await supabase.from("guests").insert(guestsToInsert);
        }
    }

    return null;
};

export default function Guests() {
    const { guests } = useLoaderData<typeof loader>();
    const [filter, setFilter] = useState<"todos" | "confirmado" | "pendente" | "recusado">("todos");
    const [groupFilter, setGroupFilter] = useState<string>("todos");
    const [showAddGuest, setShowAddGuest] = useState(false);

    const filteredGuests = guests.filter((guest: any) => {
        const matchesStatus = filter === "todos" ? true : guest.rsvp_status === filter;
        const matchesGroup = groupFilter === "todos" ? true : guest.group_name === groupFilter;
        return matchesStatus && matchesGroup;
    });

    const totalAdults = guests.reduce((acc: any, curr: any) => acc + (curr.adults_count || 0), 0);
    const totalChildren = guests.reduce((acc: any, curr: any) => acc + (curr.children_count || 0), 0);
    const totalGuests = totalAdults + totalChildren;

    const confirmedAdults = guests.filter((g: any) => g.rsvp_status === 'confirmado').reduce((acc: any, curr: any) => acc + (curr.adults_count || 0), 0);
    const confirmedChildren = guests.filter((g: any) => g.rsvp_status === 'confirmado').reduce((acc: any, curr: any) => acc + (curr.children_count || 0), 0);
    const confirmedTotal = confirmedAdults + confirmedChildren;

    const groups = Array.from(new Set(guests.map((g: any) => g.group_name))).filter(Boolean);

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-primary">{confirmedTotal}</span> confirmados
                        <span className="text-xs ml-1">({confirmedAdults} Ad. / {confirmedChildren} Cr.)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">de {totalGuests} total</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                    <Users className="text-primary w-6 h-6" />
                </div>
            </header>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-3 gap-2">
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-green-700">
                            {guests.filter((g: any) => g.rsvp_status === 'confirmado').length}
                        </div>
                        <div className="text-[10px] text-green-600 uppercase font-medium">Sim</div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-yellow-700">
                            {guests.filter((g: any) => g.rsvp_status === 'pendente').length}
                        </div>
                        <div className="text-[10px] text-yellow-600 uppercase font-medium">Talvez</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-red-700">
                            {guests.filter((g: any) => g.rsvp_status === 'recusado').length}
                        </div>
                        <div className="text-[10px] text-red-600 uppercase font-medium">Não</div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos Detalhados (Collapsible ou sempre visível? Vamos colocar sempre visível por enquanto) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Por Grupo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groups.map(g => ({
                                name: g,
                                value: guests.filter((guest: any) => guest.group_name === g).length
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Ações em Massa */}
            <div className="flex justify-end">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" /> Importar CSV
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Importar Convidados</DialogTitle>
                            <DialogDescription>
                                Cole os dados no formato: Nome, Grupo, Adultos, Crianças (um por linha).
                            </DialogDescription>
                        </DialogHeader>
                        <Form method="post" className="space-y-4">
                            <Textarea
                                name="csv_data"
                                placeholder="Ex: Tio João, Família Noivo, 2, 0&#10;Prima Maria, Família Noiva, 1, 1"
                                className="min-h-[200px]"
                            />
                            <Button type="submit" name="intent" value="bulk_import" className="w-full">
                                Importar
                            </Button>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filtros */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {["todos", "confirmado", "pendente", "recusado"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap ${filter === f
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                >
                    <option value="todos">Todos os Grupos</option>
                    {groups.map((g: any) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </div>



            {/* Lista de Convidados */}
            <div className="space-y-2">
                {filteredGuests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum convidado encontrado.
                    </div>
                ) : (
                    filteredGuests.map((guest: any) => (
                        <div
                            key={guest.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card border-border"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                  h-9 w-9 rounded-full flex flex-col items-center justify-center text-[10px] font-bold leading-tight
                  ${guest.rsvp_status === 'confirmado' ? 'bg-green-100 text-green-700' :
                                        guest.rsvp_status === 'recusado' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'}
                `}>
                                    <span>{guest.adults_count + (guest.children_count || 0)}</span>
                                    <span className="font-normal opacity-75 text-[8px]">Total</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{guest.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span className="bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{guest.group_name}</span>
                                        {(guest.children_count > 0) && (
                                            <span>({guest.adults_count} Ad. + {guest.children_count} Cr.)</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link to={`/guests/${guest.id}`} className="cursor-pointer flex items-center">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            <span>Editar</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={`https://wa.me/?text=Olá ${guest.name.split(' ')[0]}, você foi convidado para o nosso casamento! Veja todos os detalhes e confirme sua presença aqui: https://nosdois-mu.vercel.app/public/wedding`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="cursor-pointer flex items-center text-green-600"
                                        >
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            <span>Enviar Convite</span>
                                        </a>
                                    </DropdownMenuItem>
                                    {guest.rsvp_status === 'pendente' && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Form method="post" className="w-full cursor-pointer">
                                                    <input type="hidden" name="id" value={guest.id} />
                                                    <input type="hidden" name="status" value="confirmado" />
                                                    <button type="submit" name="intent" value="rsvp_action" className="flex w-full items-center">
                                                        <Check className="mr-2 h-4 w-4 text-green-600" />
                                                        <span>Confirmar</span>
                                                    </button>
                                                </Form>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Form method="post" className="w-full cursor-pointer">
                                                    <input type="hidden" name="id" value={guest.id} />
                                                    <input type="hidden" name="status" value="recusado" />
                                                    <button type="submit" name="intent" value="rsvp_action" className="flex w-full items-center">
                                                        <X className="mr-2 h-4 w-4 text-red-600" />
                                                        <span>Recusar</span>
                                                    </button>
                                                </Form>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                                        <Form method="post" className="w-full cursor-pointer">
                                            <input type="hidden" name="id" value={guest.id} />
                                            <button type="submit" name="intent" value="delete" className="flex w-full items-center">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Excluir</span>
                                            </button>
                                        </Form>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                )}
            </div>

            {/* FAB para Adicionar Convidado */}
            <div className="fixed bottom-24 right-6 z-50">
                <Button
                    onClick={() => setShowAddGuest(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Modal de Adicionar Convidado */}
            <Dialog open={showAddGuest} onOpenChange={setShowAddGuest}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Convidado</DialogTitle>
                        <DialogDescription>
                            Adicione um novo convidado à sua lista.
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" className="space-y-3" onSubmit={() => setShowAddGuest(false)}>
                        <Input name="name" placeholder="Nome completo" required />
                        <select
                            name="group_name"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            <option value="">Grupo...</option>
                            <option value="Família Noivo">Família Noivo</option>
                            <option value="Família Noiva">Família Noiva</option>
                            <option value="Amigos Noivo">Amigos Noivo</option>
                            <option value="Amigos Noiva">Amigos Noiva</option>
                            <option value="Igreja">Igreja</option>
                            <option value="Trabalho">Trabalho</option>
                            <option value="Outros">Outros</option>
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Adultos</label>
                                <Input name="adults_count" type="number" min="1" defaultValue="1" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Crianças</label>
                                <Input name="children_count" type="number" min="0" defaultValue="0" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddGuest(false)}>Cancelar</Button>
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
