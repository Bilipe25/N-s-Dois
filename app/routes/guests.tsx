import { useState, useEffect, useCallback } from "react";
import { useLoaderData, useOutletContext, redirect } from "react-router";
import { getSession } from "@/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "@/components/ui/drawer";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FileDown, Loader2, User, Users, Calendar, MessageCircle, Check, X, Trash2, Pencil, Link2, Copy, RefreshCw, ShieldCheck } from "lucide-react";
import type { Route } from "./+types/guests";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";

// Components
import { GuestStats } from "@/components/guests/guest-stats";
import { GuestFilters } from "@/components/guests/guest-filters";
import { GuestList } from "@/components/guests/guest-list";
import type { GuestFilter } from "@/components/guests/types";

// Hooks & Schemas
import {
    useGuests,
    useAddGuest,
    useUpdateRSVP,
    useDeleteGuest,
    useBulkConfirm,
    useBulkDelete,
    useApproveGuest,
    useAppConfig,
    createGuestInviteLink
} from "@/hooks/useGuests";
import type { Guest } from "@/schemas/guest";
import { CELEBRATION_TIME_ZONE, formatCelebrationDate } from "@/lib/celebration-time";
import { confirmedCounts, formatRsvpTimestamp, guestHasPrivateMessage, latestResponseAt, respondedToday } from "@/lib/guest-rsvp";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Convidados - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        return redirect("/login");
    }

    return { user };
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

export default function Guests() {
    const { user } = useLoaderData<typeof loader>();

    // React Query Hooks
    const { data: guests = [], isLoading, isFetching, refetch } = useGuests();
    const { data: config } = useAppConfig();

    const { mutate: addGuest, isPending: isAdding } = useAddGuest(user);
    const { mutate: updateRSVP } = useUpdateRSVP(user);
    const { mutate: deleteGuest } = useDeleteGuest();
    const { mutate: bulkConfirm } = useBulkConfirm();
    const { mutate: bulkDelete } = useBulkDelete();
    const { mutate: approveGuest, isPending: isApproving } = useApproveGuest();

    // State
    const [filter, setFilter] = useState<GuestFilter>("todos");
    const [groupFilter, setGroupFilter] = useState<string>("todos");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [inviteLink, setInviteLink] = useState<{ guestId: string; url: string } | null>(null);
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [rotateInviteOpen, setRotateInviteOpen] = useState(false);

    // Derived Data
    const groups = Array.from(new Set(guests.map((g) => g.group_name))).filter(Boolean) as string[];

    const filteredGuests = guests.filter((guest) => {
        const lastResponse = latestResponseAt(guest);
        const matchesStatus = filter === "todos" ? true
            : filter === "public_rsvp" ? guest.source === "public_rsvp"
                : filter === "confirmed_today" ? guest.rsvp_status === "confirmado" && respondedToday(lastResponse)
                    : filter === "with_message" ? guestHasPrivateMessage(guest)
                        : guest.rsvp_status === filter;
        const matchesGroup = groupFilter === "todos" ? true : guest.group_name === groupFilter;
        const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guest.group_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesGroup && matchesSearch;
    });

    useEffect(() => {
        if (!selectedGuest) return;
        const current = guests.find((guest) => guest.id === selectedGuest.id);
        if (current) setSelectedGuest(current);
    }, [guests, selectedGuest?.id]);

    // Handlers
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const generateInviteLink = async (mode: "create" | "rotate") => {
        if (!selectedGuest) return null;
        setIsCreatingInvite(true);
        try {
            const { inviteUrl, invite } = await createGuestInviteLink(selectedGuest.id, mode);
            setInviteLink({ guestId: selectedGuest.id, url: inviteUrl });
            setSelectedGuest({ ...selectedGuest, invite });
            setRotateInviteOpen(false);
            toast.success(mode === "rotate" ? "Novo link criado. O anterior não funciona mais." : "Link de convite criado.");
            return inviteUrl;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível criar o convite.");
            return null;
        } finally {
            setIsCreatingInvite(false);
        }
    };

    const handleCopyInvite = async () => {
        const currentLink = inviteLink;
        const url = currentLink && currentLink.guestId === selectedGuest?.id ? currentLink.url : null;
        if (!url) return;
        await navigator.clipboard.writeText(url);
        toast.success("Link pessoal copiado.");
    };

    const handleShareInvite = async () => {
        if (!selectedGuest) return;
        const currentLink = inviteLink;
        const url = currentLink && currentLink.guestId === selectedGuest.id ? currentLink.url : null;
        if (!url) return;
        const shareWindow = window.open("about:blank", "_blank");
        const message = `Olá ${selectedGuest.name.split(" ")[0]}, preparamos um convite pessoal para você celebrar conosco. Confirme sua presença por aqui: ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        if (shareWindow) shareWindow.location.href = whatsappUrl;
        else window.location.href = whatsappUrl;
    };

    const handleBulkConfirm = () => {
        if (!confirm(`Confirmar presença de ${selectedIds.length} convidados?`)) return;
        bulkConfirm({ ids: selectedIds }, {
            onSuccess: () => setSelectedIds([])
        });
    };

    const handleBulkDelete = () => {
        if (!confirm(`Excluir ${selectedIds.length} convidados?`)) return;
        bulkDelete({ ids: selectedIds }, {
            onSuccess: () => setSelectedIds([])
        });
    };

    const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const group_name = formData.get("group_name") as string;
        const adults_count = parseInt(formData.get("adults_count") as string) || 1;
        const children_count = parseInt(formData.get("children_count") as string) || 0;

        addGuest({ name, group_name, adults_count, children_count }, {
            onSuccess: () => setShowAddGuest(false)
        });
    };

    const handleGuestClick = (guest: Guest) => {
        setInviteLink(null);
        setRotateInviteOpen(false);
        setSelectedGuest(guest);
    };

    const handleExportPdf = useCallback(async () => {
        setIsExporting(true);
        try {
            const [{ default: pdfMake }, pdfFontsModule] = await Promise.all([
                import("pdfmake/build/pdfmake"),
                import("pdfmake/build/vfs_fonts")
            ]);
            const pdfFonts = (pdfFontsModule as any).default || pdfFontsModule;
            (pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

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
            guests.forEach((guest) => {
                const group = guest.group_name || "Outros";
                if (!groupedGuests[group]) groupedGuests[group] = [];
                groupedGuests[group].push(guest);
            });

            const content: any[] = [];

            // Totais
            const totalAdults = guests.reduce((acc, curr) => acc + (curr.adults_count || 0), 0);
            const totalChildren = guests.reduce((acc, curr) => acc + (curr.children_count || 0), 0);
            const totalGuests = totalAdults + totalChildren;
            const confirmedGuests = guests.filter(g => g.rsvp_status === 'confirmado');
            const confirmedTotal = confirmedGuests.reduce((acc, curr) => { const counts = confirmedCounts(curr); return acc + counts.adults + counts.children; }, 0);

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
                const groupAdults = groupGuests.reduce((acc, g) => acc + confirmedCounts(g).adults, 0);
                const groupChildren = groupGuests.reduce((acc, g) => acc + confirmedCounts(g).children, 0);

                content.push({
                    text: `${group} (${groupGuests.length} convites)`,
                    style: 'groupHeader',
                    margin: [0, 10, 0, 5]
                });

                const tableBody: any[] = [
                    [
                        { text: 'Nome', style: 'tableHeader' },
                        { text: 'Adultos confirmados', style: 'tableHeader', alignment: 'center' },
                        { text: 'Crianças confirmadas', style: 'tableHeader', alignment: 'center' },
                        { text: 'Status', style: 'tableHeader', alignment: 'center' }
                    ]
                ];

                groupGuests.forEach(guest => {
                    const responseCounts = confirmedCounts(guest);
                    let statusColor = 'gray';
                    if (guest.rsvp_status === 'confirmado') statusColor = 'green';
                    if (guest.rsvp_status === 'recusado') statusColor = 'red';
                    if (guest.rsvp_status === 'pendente') statusColor = '#ca8a04'; // yellow-600

                    tableBody.push([
                        { text: guest.name, style: 'tableCell' },
                        { text: responseCounts.adults.toString(), style: 'tableCell', alignment: 'center' },
                        { text: responseCounts.children.toString(), style: 'tableCell', alignment: 'center' },
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
                    header: { fontSize: 22, bold: true, color: '#be123c' },
                    subheader: { fontSize: 14, color: '#881337' },
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

            (pdfMake as any).createPdf(docDefinition).download('lista_convidados_casamento.pdf');

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar PDF. Verifique o console.");
        } finally {
            setIsExporting(false);
        }
    }, [config, guests]);

    const { setHeaderAction } = useOutletContext<{ setHeaderAction: (node: React.ReactNode) => void }>();

    useEffect(() => {
        setHeaderAction(
            <Button
                variant="ghost"
                size="icon"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="text-muted-foreground hover:text-primary"
                title="Exportar PDF"
            >
                {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
            </Button>
        );
        return () => setHeaderAction(null);
    }, [isExporting, handleExportPdf, setHeaderAction]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    const statusColors = {
        confirmado: "bg-green-100 text-green-700",
        recusado: "bg-red-100 text-red-700",
        pendente: "bg-yellow-100 text-yellow-700",
    };
    const selectedCounts = selectedGuest ? confirmedCounts(selectedGuest) : null;
    const selectedLastResponse = selectedGuest ? formatRsvpTimestamp(latestResponseAt(selectedGuest)) : null;

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            <div className="container mx-auto max-w-5xl p-4 space-y-6">
                {/* Stats */}
                <GuestStats guests={guests} />

                {/* Main Content */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                        <span>Horários em {CELEBRATION_TIME_ZONE}</span>
                        <Button type="button" variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()} className="min-h-11 rounded-full">
                            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Atualizar respostas
                        </Button>
                    </div>
                    <GuestFilters
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filter={filter}
                        onFilterChange={setFilter}
                        groupFilter={groupFilter}
                        onGroupFilterChange={setGroupFilter}
                        groups={groups}
                        selectedCount={selectedIds.length}
                        onBulkConfirm={handleBulkConfirm}
                        onBulkDelete={handleBulkDelete}
                        onClearSelection={() => setSelectedIds([])}
                    />

                    <GuestList
                        guests={filteredGuests}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onUpdateRSVP={(id, status) => updateRSVP({ id, status })}
                        onDelete={(id) => deleteGuest(id)}
                        onGuestClick={handleGuestClick}
                    />
                </div>
            </div>

            {/* FAB para Adicionar Convidado */}
            {!showAddGuest && !selectedGuest && (
                <div className="fixed bottom-safe-24 right-6 z-40">
                    <Button
                        onClick={() => setShowAddGuest(true)}
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-xl bg-stone-900 hover:bg-stone-800 text-white transition-transform hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {/* Drawer de Adicionar Convidado */}
            <Drawer open={showAddGuest} onOpenChange={setShowAddGuest}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="text-left border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-stone-100">
                                <User className="h-6 w-6 text-stone-600" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl">Adicionar Convidado</DrawerTitle>
                                <DrawerDescription>Adicione um ou mais convidados</DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>
                    <form onSubmit={handleAddSubmit} className="px-4 py-4 space-y-4 overflow-y-auto">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Nome(s)</label>
                            <textarea
                                name="name"
                                placeholder="Ex: Gabriel Silva&#10;Raabe Silva"
                                required
                                className="flex min-h-[100px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
                            />
                            <p className="text-xs text-stone-400">Dica: Cole uma lista de nomes para adicionar vários de uma vez.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Grupo</label>
                            <select
                                name="group_name"
                                className="flex h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="Família Noivo">Família Noivo</option>
                                <option value="Família Noiva">Família Noiva</option>
                                <option value="Amigos Noivo">Amigos Noivo</option>
                                <option value="Amigos Noiva">Amigos Noiva</option>
                                <option value="Igreja">Igreja</option>
                                <option value="Trabalho">Trabalho</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700">Adultos</label>
                                <Input name="adults_count" type="number" min="1" defaultValue="1" className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700">Crianças</label>
                                <Input name="children_count" type="number" min="0" defaultValue="0" className="h-11" />
                            </div>
                        </div>

                        <DrawerFooter className="flex-row gap-2 px-0 pt-4 border-t">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddGuest(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isAdding} className="flex-1 bg-stone-900 hover:bg-stone-800">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                            </Button>
                        </DrawerFooter>
                    </form>
                </DrawerContent>
            </Drawer>

            {/* Drawer de Detalhes do Convidado */}
            <Drawer open={!!selectedGuest} onOpenChange={(open) => {
                if (!open) {
                    setSelectedGuest(null);
                    setInviteLink(null);
                    setRotateInviteOpen(false);
                }
            }}>
                <DrawerContent className="max-h-[90vh]">
                    {selectedGuest && (
                        <>
                            <DrawerHeader className="text-left border-b pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold border-2 ${statusColors[selectedGuest.rsvp_status as keyof typeof statusColors] || statusColors.pendente}`}>
                                            {selectedGuest.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                                        </div>
                                        <div>
                                            <DrawerTitle className="text-xl">{selectedGuest.name}</DrawerTitle>
                                            <Badge
                                                variant="outline"
                                                className={`mt-1 ${selectedGuest.rsvp_status === 'confirmado' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        selectedGuest.rsvp_status === 'recusado' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                    }`}
                                            >
                                                {selectedGuest.rsvp_status === 'confirmado' ? 'Confirmado' :
                                                    selectedGuest.rsvp_status === 'recusado' ? 'Recusado' : 'Pendente'}
                                            </Badge>
                                            {selectedGuest.source === "public_rsvp" && <Badge variant="outline" className="ml-2 mt-1 border-violet-200 bg-violet-100 text-violet-700">Novo pelo site</Badge>}
                                        </div>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="px-4 py-4 space-y-4 overflow-y-auto">
                                {/* Info Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-stone-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-stone-500 mb-1">
                                            <Users className="h-4 w-4" />
                                            <span className="text-xs">Grupo</span>
                                        </div>
                                        <p className="font-medium text-stone-900">{selectedGuest.group_name}</p>
                                    </div>
                                    <div className="bg-stone-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-stone-500 mb-1">
                                            <User className="h-4 w-4" />
                                            <span className="text-xs">{selectedGuest.source === "public_rsvp" ? "Resposta atual" : "Convite"}</span>
                                        </div>
                                        <p className="font-medium text-stone-900">
                                            {selectedGuest.source === "public_rsvp"
                                                ? <>{selectedCounts?.adults ?? 0} adulto{selectedCounts?.adults !== 1 ? 's' : ''} · {selectedCounts?.children ?? 0} criança{selectedCounts?.children !== 1 ? 's' : ''}</>
                                                : <>Até {selectedGuest.adults_count} adulto{selectedGuest.adults_count !== 1 ? 's' : ''} · {selectedGuest.children_count} criança{selectedGuest.children_count !== 1 ? 's' : ''}</>}
                                        </p>
                                    </div>
                                </div>

                                {selectedGuest.source !== "public_rsvp" && <div className="rounded-xl bg-stone-50 p-4">
                                    <p className="text-xs text-stone-500">Resposta atual</p>
                                    <p className="mt-1 font-medium text-stone-900">{selectedGuest.rsvp_status === "pendente" ? "Ainda sem resposta" : selectedGuest.rsvp_status === "recusado" ? "Não poderá comparecer" : `${selectedCounts?.adults ?? 0} adulto(s) · ${selectedCounts?.children ?? 0} criança(s)`}</p>
                                </div>}

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-stone-50 p-4">
                                        <p className="text-xs text-stone-500">Origem</p>
                                        <p className="mt-1 font-medium text-stone-900">{selectedGuest.source === "public_rsvp" ? "Novo pelo site" : "Lista do casal"}</p>
                                    </div>
                                    <div className="rounded-xl bg-stone-50 p-4">
                                        <p className="text-xs text-stone-500">Última resposta</p>
                                        <p className="mt-1 font-medium text-stone-900">{selectedLastResponse || "Ainda sem resposta"}</p>
                                    </div>
                                </div>

                                {selectedGuest.phone && <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Telefone privado</p><p className="mt-1 font-medium text-stone-900">{selectedGuest.phone}</p></div>}

                                {selectedGuest.created_at && (
                                    <div className="bg-stone-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-stone-500 mb-1">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-xs">Adicionado em</span>
                                        </div>
                                        <p className="font-medium text-stone-900">
                                            {new Date(selectedGuest.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}

                                {selectedGuest.source === "public_rsvp" && <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
                                    <div><p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Cadastro espontâneo</p><p className="mt-1 text-sm text-stone-700">{selectedGuest.review_status === "pending" ? "Aguardando revisão do casal." : "Cadastro revisado e aprovado."}</p></div>
                                    <p className="text-sm text-stone-700"><strong>Pessoas informadas:</strong> {selectedGuest.rsvp_adults ?? 0} adulto(s) e {selectedGuest.rsvp_children ?? 0} criança(s).</p>
                                    {selectedGuest.review_status === "pending" && <Button type="button" disabled={isApproving} className="min-h-11 w-full bg-violet-700 text-white hover:bg-violet-800" onClick={() => approveGuest(selectedGuest.id, { onSuccess: () => setSelectedGuest({ ...selectedGuest, review_status: "approved" }) })}>{isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Aprovar cadastro</Button>}
                                </div>}

                                {selectedGuest.rsvp_message && <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm leading-relaxed text-rose-950"><span className="mb-1 block text-xs font-semibold text-rose-800">Mensagem privada geral</span>{selectedGuest.rsvp_message}</div>}

                                {selectedGuest.event_responses && selectedGuest.event_responses.length > 0 && <section className="space-y-3" aria-labelledby="guest-event-responses"><h3 id="guest-event-responses" className="text-sm font-semibold text-stone-800">Respostas por evento</h3>{selectedGuest.event_responses.map((response) => <article key={response.id} className="rounded-xl border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-medium text-stone-900">{response.event_title}</h4>{response.event_starts_at && <p className="mt-1 text-xs text-stone-500">{formatCelebrationDate(response.event_starts_at)}</p>}</div><Badge variant="outline" className={response.status === "confirmado" ? "border-green-200 bg-green-50 text-green-800" : response.status === "recusado" ? "border-red-200 bg-red-50 text-red-800" : "border-yellow-200 bg-yellow-50 text-yellow-800"}>{response.status === "confirmado" ? "Confirmado" : response.status === "recusado" ? "Recusado" : "Pendente"}</Badge></div><p className="mt-3 text-sm text-stone-600">{response.status === "recusado" ? "Sem presença confirmada" : `${response.confirmed_adults} adulto(s) e ${response.confirmed_children} criança(s)`}</p>{response.private_message && <div className="mt-3 rounded-lg bg-rose-50 p-3 text-sm leading-relaxed text-stone-700"><span className="block text-xs font-semibold text-rose-800">Mensagem privada</span>{response.private_message}</div>}{response.responded_at && <p className="mt-3 text-xs text-stone-500">Respondido em {formatRsvpTimestamp(response.responded_at)}</p>}</article>)}</section>}

                                {/* Ações Rápidas */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-stone-500">Ações Rápidas</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedGuest.rsvp_status !== 'confirmado' && (
                                            <Button
                                                variant="outline"
                                                className="h-12 border-green-200 text-green-700 hover:bg-green-50"
                                                onClick={() => {
                                                    updateRSVP({ id: selectedGuest.id, status: 'confirmado' });
                                                    setSelectedGuest({ ...selectedGuest, rsvp_status: 'confirmado' });
                                                }}
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Confirmar
                                            </Button>
                                        )}
                                        {selectedGuest.rsvp_status !== 'recusado' && (
                                            <Button
                                                variant="outline"
                                                className="h-12 border-red-200 text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    updateRSVP({ id: selectedGuest.id, status: 'recusado' });
                                                    setSelectedGuest({ ...selectedGuest, rsvp_status: 'recusado' });
                                                }}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Recusar
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <details className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                                  <summary className="cursor-pointer text-sm font-medium text-stone-800">Opções avançadas de convite individual</summary>
                                  <div className="mt-4 space-y-3">
                                    <div className="flex items-start gap-2 text-sm text-stone-700">
                                        {selectedGuest.invite?.active ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-700" /> : <Link2 className="mt-0.5 h-4 w-4 shrink-0" />}
                                        <div className="min-w-0 space-y-1">
                                            <p className="font-medium text-stone-900">{selectedGuest.invite?.active ? "Convite ativo" : "Link individual"}</p>
                                            {selectedGuest.invite?.active ? (
                                                <>
                                                    <p className="text-xs text-stone-600">Criado em {new Date(selectedGuest.invite.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                                                    <p className="text-xs text-stone-600">{selectedGuest.invite.last_used_at ? `Último uso em ${new Date(selectedGuest.invite.last_used_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : "Ainda não utilizado"}</p>
                                                </>
                                            ) : <p className="text-xs text-stone-600">Crie um link pessoal para RSVP e reservas vinculadas a este convidado.</p>}
                                        </div>
                                    </div>

                                    {inviteLink?.guestId === selectedGuest.id && (
                                        <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm" role="status">
                                            <p className="text-xs font-medium text-stone-800">Novo link pronto — copie ou envie agora. Ele não poderá ser recuperado depois que esta tela for fechada.</p>
                                            <p className="break-all rounded-md bg-stone-100 p-2 text-xs text-stone-700">{inviteLink.url}</p>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <Button type="button" variant="outline" className="min-h-11" onClick={handleCopyInvite}>
                                                    <Copy className="mr-2 h-4 w-4" />Copiar link
                                                </Button>
                                                <Button type="button" className="min-h-11 bg-green-600 text-white hover:bg-green-700" onClick={handleShareInvite}>
                                                    <MessageCircle className="mr-2 h-4 w-4" />Enviar pelo WhatsApp
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {!selectedGuest.invite?.active ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-12 w-full"
                                            disabled={isCreatingInvite}
                                            onClick={() => void generateInviteLink("create")}
                                        >
                                            {isCreatingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                                            Criar link de convite
                                        </Button>
                                    ) : inviteLink?.guestId !== selectedGuest.id && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-12 w-full"
                                            disabled={isCreatingInvite}
                                            onClick={() => setRotateInviteOpen(true)}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />Gerar novo link
                                        </Button>
                                    )}
                                  </div>
                                </details>
                            </div>

                            <DrawerFooter className="flex-row gap-2 border-t pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    asChild
                                >
                                    <Link to={`/guests/${selectedGuest.id}`}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                        if (confirm("Tem certeza que deseja excluir este convidado?")) {
                                            deleteGuest(selectedGuest.id);
                                            setSelectedGuest(null);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>

            <AlertDialog open={rotateInviteOpen} onOpenChange={setRotateInviteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Gerar novo link?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Gerar um novo link fará o convite anterior parar de funcionar. Utilize esta opção somente se precisar substituir o link enviado anteriormente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCreatingInvite}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isCreatingInvite}
                            onClick={() => void generateInviteLink("rotate")}
                            className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                            {isCreatingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Gerar novo link
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

