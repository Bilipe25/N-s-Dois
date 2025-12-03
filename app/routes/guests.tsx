import { useState, useEffect, useCallback } from "react";
import { useLoaderData, useOutletContext, redirect } from "react-router";
import { getSession } from "@/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Plus, FileDown, Loader2 } from "lucide-react";
import type { Route } from "./+types/guests";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { toast } from "sonner";

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
    useAppConfig
} from "@/hooks/useGuests";
import type { Guest } from "@/schemas/guest";

// Registrar fontes (necessário para pdfmake no client-side)
// @ts-ignore
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

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
    const { data: guests = [], isLoading } = useGuests();
    const { data: config } = useAppConfig();

    const { mutate: addGuest, isPending: isAdding } = useAddGuest(user);
    const { mutate: updateRSVP } = useUpdateRSVP(user);
    const { mutate: deleteGuest } = useDeleteGuest();
    const { mutate: bulkConfirm } = useBulkConfirm();
    const { mutate: bulkDelete } = useBulkDelete();

    // State
    const [filter, setFilter] = useState<GuestFilter>("todos");
    const [groupFilter, setGroupFilter] = useState<string>("todos");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Derived Data
    const groups = Array.from(new Set(guests.map((g) => g.group_name))).filter(Boolean) as string[];

    const filteredGuests = guests.filter((guest) => {
        const matchesStatus = filter === "todos" ? true : guest.rsvp_status === filter;
        const matchesGroup = groupFilter === "todos" ? true : guest.group_name === groupFilter;
        const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guest.group_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesGroup && matchesSearch;
    });

    // Handlers
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
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

    const handleExportPdf = useCallback(async () => {
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
            const confirmedTotal = confirmedGuests.reduce((acc, curr) => acc + (curr.adults_count || 0) + (curr.children_count || 0), 0);

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

            pdfMake.createPdf(docDefinition).download('lista_convidados_casamento.pdf');

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

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            <div className="container mx-auto max-w-5xl p-4 space-y-6">
                {/* Stats */}
                <GuestStats guests={guests as any} />

                {/* Main Content */}
                <div className="space-y-4">
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
                        guests={filteredGuests as any}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onUpdateRSVP={(id, status) => updateRSVP({ id, status })}
                        onDelete={(id) => deleteGuest(id)}
                    />
                </div>
            </div>

            {/* FAB para Adicionar Convidado */}
            <div className="fixed bottom-24 right-6 z-50">
                <Button
                    onClick={() => setShowAddGuest(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-xl bg-stone-900 hover:bg-stone-800 text-white transition-transform hover:scale-105 active:scale-95"
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
                            Adicione um ou mais convidados. Para adicionar vários, cole uma lista de nomes (um por linha).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-stone-500">Nome(s)</label>
                            <textarea
                                name="name"
                                placeholder="Ex: Gabriel Silva&#10;Raabe Silva"
                                required
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <p className="text-[10px] text-stone-400">Dica: Cole uma lista de nomes para adicionar vários de uma vez.</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-stone-500">Grupo</label>
                            <select
                                name="group_name"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-stone-500">Adultos (por convite)</label>
                                <Input name="adults_count" type="number" min="1" defaultValue="1" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-stone-500">Crianças (por convite)</label>
                                <Input name="children_count" type="number" min="0" defaultValue="0" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddGuest(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isAdding} className="bg-stone-900">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Adicionar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
