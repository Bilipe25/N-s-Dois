import { useState } from "react";
import { useLoaderData, Form, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
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
import { Plus, Users, Check, X, MoreHorizontal, Trash2, Pencil, MessageCircle, FileDown, Loader2, Search } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { Route } from "./+types/guests";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Registrar fontes (necessário para pdfmake no client-side)
// @ts-ignore
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

export const meta: Route.MetaFunction = () => {
    return [{ title: "Convidados - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);

    // Buscar convidados e configurações em paralelo
    const [guestsResult, configResult] = await Promise.all([
        supabase.from("guests").select("*").order("name", { ascending: true }),
        supabase.from("app_config").select("*").single()
    ]);

    if (guestsResult.error) {
        console.error("Error fetching guests:", guestsResult.error);
        return { guests: [], config: null };
    }

    return {
        guests: guestsResult.data || [],
        config: configResult.data
    };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);
    const { sendPushToUser } = await import("@/services/push.server");

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

        // Notificar
        const session = await getSession(request.headers.get("Cookie"));
        const user = session.get("user");

        if (user) {
            await supabase.from("notifications").insert({
                type: "rsvp",
                title: "Novo Convidado ➕",
                message: `${user} adicionou um novo convidado: ${name} (${group_name}).`,
                link: "/guests"
            });

            // Enviar Push
            const partnerName = user === "Gabriel" ? "Raabe" : "Gabriel";
            await sendPushToUser(request, "all", "Novo Convidado ➕", `${user} adicionou um novo convidado: ${name} (${group_name}).`, "/guests");
        }
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

            // Enviar Push
            const session = await getSession(request.headers.get("Cookie"));
            const user = session.get("user");
            if (user) {
                const partnerName = user === "Gabriel" ? "Raabe" : "Gabriel";
                await sendPushToUser(request, "all", "Atualização de RSVP 📩", `${guest.name} teve a presença marcada como "${status}".`, "/guests");
            }
        }
    }

    return null;
};

// Função auxiliar para converter imagem URL para Base64
const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = error => {
            reject(error);
        };
        img.src = url;
    });
};

// Componente para renderizar um item de convidado
const GuestItem = ({ guest }: { guest: any }) => {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card border-border">
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
    );
};

export default function Guests() {
    const { guests, config } = useLoaderData<typeof loader>();
    const [filter, setFilter] = useState<"todos" | "confirmado" | "pendente" | "recusado">("todos");
    const [groupFilter, setGroupFilter] = useState<string>("todos");
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    const filteredGuests = guests.filter((guest: any) => {
        const matchesStatus = filter === "todos" ? true : guest.rsvp_status === filter;
        const matchesGroup = groupFilter === "todos" ? true : guest.group_name === groupFilter;
        return matchesStatus && matchesGroup;
    });

    const searchResults = guests.filter((guest: any) =>
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.group_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAdults = guests.reduce((acc: any, curr: any) => acc + (curr.adults_count || 0), 0);
    const totalChildren = guests.reduce((acc: any, curr: any) => acc + (curr.children_count || 0), 0);
    const totalGuests = totalAdults + totalChildren;

    const confirmedAdults = guests.filter((g: any) => g.rsvp_status === 'confirmado').reduce((acc: any, curr: any) => acc + (curr.adults_count || 0), 0);
    const confirmedChildren = guests.filter((g: any) => g.rsvp_status === 'confirmado').reduce((acc: any, curr: any) => acc + (curr.children_count || 0), 0);
    const confirmedTotal = confirmedAdults + confirmedChildren;

    const groups = Array.from(new Set(guests.map((g: any) => g.group_name))).filter(Boolean) as string[];

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            let logoBase64 = null;
            if (config?.logo_url) {
                try {
                    logoBase64 = await getBase64ImageFromURL(config.logo_url);
                } catch (e) {
                    console.error("Erro ao carregar logo:", e);
                }
            }

            // Agrupar convidados
            const groupedGuests: Record<string, any[]> = {};
            guests.forEach((guest: any) => {
                const group = guest.group_name || "Outros";
                if (!groupedGuests[group]) groupedGuests[group] = [];
                groupedGuests[group].push(guest);
            });

            const content: any[] = [];

            // Cabeçalho
            const headerColumns: any[] = [];
            if (logoBase64) {
                headerColumns.push({ image: logoBase64, width: 60, height: 60 });
            }
            headerColumns.push({
                stack: [
                    { text: 'Lista de Convidados', style: 'header', alignment: logoBase64 ? 'left' : 'center' },
                    { text: 'Casamento', style: 'subheader', alignment: logoBase64 ? 'left' : 'center' },
                    { text: config?.wedding_date ? new Date(config.wedding_date).toLocaleDateString('pt-BR') : '', style: 'small', alignment: logoBase64 ? 'left' : 'center' }
                ],
                margin: [logoBase64 ? 15 : 0, 10, 0, 0]
            });

            content.push({ columns: headerColumns, margin: [0, 0, 0, 20] });
            content.push({ canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#e5e7eb' }], margin: [0, 0, 0, 20] });

            // Resumo
            content.push({ text: 'Resumo Geral', style: 'sectionHeader' });
            content.push({
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        [
                            { text: 'Total Convidados', style: 'tableHeader' },
                            { text: 'Confirmados', style: 'tableHeader' },
                            { text: 'Adultos', style: 'tableHeader' },
                            { text: 'Crianças', style: 'tableHeader' }
                        ],
                        [
                            { text: totalGuests.toString(), alignment: 'center' },
                            { text: confirmedTotal.toString(), alignment: 'center', color: 'green', bold: true },
                            { text: totalAdults.toString(), alignment: 'center' },
                            { text: totalChildren.toString(), alignment: 'center' }
                        ]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 20]
            });

            // Listas por Grupo
            Object.keys(groupedGuests).sort().forEach(group => {
                const groupGuests = groupedGuests[group];
                const groupAdults = groupGuests.reduce((acc, g) => acc + (g.adults_count || 0), 0);
                const groupChildren = groupGuests.reduce((acc, g) => acc + (g.children_count || 0), 0);

                content.push({
                    text: `${group} (${groupGuests.length} convites)`,
                    style: 'groupHeader',
                    margin: [0, 10, 0, 5]
                });

                const tableBody: any[] = [
                    [
                        { text: 'Nome', style: 'tableHeader' },
                        { text: 'Adultos', style: 'tableHeader', alignment: 'center' },
                        { text: 'Crianças', style: 'tableHeader', alignment: 'center' },
                        { text: 'Status', style: 'tableHeader', alignment: 'center' }
                    ]
                ];

                groupGuests.forEach(guest => {
                    let statusColor = 'gray';
                    if (guest.rsvp_status === 'confirmado') statusColor = 'green';
                    if (guest.rsvp_status === 'recusado') statusColor = 'red';
                    if (guest.rsvp_status === 'pendente') statusColor = '#ca8a04'; // yellow-600

                    tableBody.push([
                        { text: guest.name, style: 'tableCell' },
                        { text: guest.adults_count.toString(), style: 'tableCell', alignment: 'center' },
                        { text: guest.children_count.toString(), style: 'tableCell', alignment: 'center' },
                        { text: guest.rsvp_status.toUpperCase(), style: 'tableCell', alignment: 'center', color: statusColor, fontSize: 8, bold: true }
                    ]);
                });

                // Subtotal do grupo
                tableBody.push([
                    { text: 'Total do Grupo', style: 'tableHeader', alignment: 'right' },
                    { text: groupAdults.toString(), style: 'tableHeader', alignment: 'center' },
                    { text: groupChildren.toString(), style: 'tableHeader', alignment: 'center' },
                    { text: '', style: 'tableHeader' }
                ]);

                content.push({
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: tableBody
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 15]
                });
            });

            const docDefinition = {
                content: content,
                styles: {
                    header: { fontSize: 22, bold: true, color: '#be123c' }, // rose-700
                    subheader: { fontSize: 14, color: '#881337' }, // rose-900
                    small: { fontSize: 10, color: '#6b7280' },
                    sectionHeader: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] as [number, number, number, number], color: '#374151' },
                    groupHeader: { fontSize: 12, bold: true, color: '#be123c', decoration: 'underline' as const },
                    tableHeader: { bold: true, fontSize: 10, color: 'black', fillColor: '#f3f4f6' },
                    tableCell: { fontSize: 10, color: '#374151' }
                },
                defaultStyle: {
                    font: 'Roboto'
                }
            };

            pdfMake.createPdf(docDefinition).download('lista_convidados_casamento.pdf');

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar PDF. Verifique o console.");
        } finally {
            setIsExporting(false);
        }
    };

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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="gap-2 text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        Exportar PDF
                    </Button>
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

            {/* Gráficos Detalhados */}
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
                        <GuestItem key={guest.id} guest={guest} />
                    ))
                )}
            </div>

            {/* FAB para Buscar Convidado */}
            <div className="fixed bottom-40 right-6 z-50">
                <Button
                    onClick={() => setShowSearch(true)}
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                    <Search className="h-5 w-5" />
                </Button>
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

            {/* Modal de Busca */}
            <Dialog open={showSearch} onOpenChange={setShowSearch}>
                <DialogContent className="max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Buscar Convidado</DialogTitle>
                        <DialogDescription>
                            Digite o nome ou grupo para filtrar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {searchTerm && searchResults.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    Nenhum resultado encontrado.
                                </div>
                            ) : (
                                (searchTerm ? searchResults : []).map((guest: any) => (
                                    <GuestItem key={guest.id} guest={guest} />
                                ))
                            )}
                            {!searchTerm && (
                                <div className="text-center py-4 text-muted-foreground text-xs">
                                    Digite para buscar...
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
