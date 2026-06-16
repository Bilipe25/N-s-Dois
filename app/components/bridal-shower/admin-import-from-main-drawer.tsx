import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Search } from "lucide-react";
import type { Guest as MainGuest } from "@/schemas/guest";

interface AdminImportFromMainDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mainGuests: MainGuest[];
    currentGuests: any[];
    isLoadingMainGuests: boolean;
    importGuestsFromMain: any;
}

export function AdminImportFromMainDrawer({
    open,
    onOpenChange,
    mainGuests,
    currentGuests,
    isLoadingMainGuests,
    importGuestsFromMain
}: AdminImportFromMainDrawerProps) {
    const [selectedMainGuests, setSelectedMainGuests] = useState<string[]>([]);
    const [mainGuestSearch, setMainGuestSearch] = useState("");

    const handleSelectMainGuest = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedMainGuests(prev => [...prev, id]);
        } else {
            setSelectedMainGuests(prev => prev.filter(gId => gId !== id));
        }
    };

    const handleImportFromMainSubmit = () => {
        if (selectedMainGuests.length === 0) return;
        const guestsToImport = mainGuests.filter(g => selectedMainGuests.includes(g.id));
        importGuestsFromMain.mutate(guestsToImport, {
            onSuccess: () => {
                onOpenChange(false);
                setSelectedMainGuests([]);
                setMainGuestSearch("");
            }
        });
    };

    const filteredMainGuests = mainGuests.filter(g =>
        g.name.toLowerCase().includes(mainGuestSearch.toLowerCase())
    );

    const importedGuestNames = new Set(currentGuests.map(g => g.name.toLowerCase()));
    const availableMainGuests = filteredMainGuests.filter(g => !importedGuestNames.has(g.name.toLowerCase()));

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-rose-100">
                            <Users className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <DrawerTitle>Importar Convidados</DrawerTitle>
                            <DrawerDescription>
                                Selecione os convidados da lista principal
                            </DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>

                <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <Input
                            placeholder="Buscar convidado..."
                            value={mainGuestSearch}
                            onChange={(e) => setMainGuestSearch(e.target.value)}
                            className="pl-10 h-11"
                        />
                    </div>

                    {selectedMainGuests.length > 0 && (
                        <div className="flex items-center justify-between bg-rose-50 p-3 rounded-lg">
                            <span className="text-sm font-medium text-rose-700">
                                {selectedMainGuests.length} selecionado(s)
                            </span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => setSelectedMainGuests([])}
                            >
                                Limpar
                            </Button>
                        </div>
                    )}

                    {isLoadingMainGuests ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                        </div>
                    ) : availableMainGuests.length === 0 ? (
                        <div className="text-center py-8 text-stone-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-stone-300" />
                            <p className="text-sm">
                                {mainGuests.length === 0
                                    ? "Nenhum convidado na lista principal"
                                    : filteredMainGuests.length === 0
                                        ? "Nenhum resultado encontrado"
                                        : "Todos os convidados já foram importados"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                                <Checkbox
                                    checked={availableMainGuests.length > 0 && selectedMainGuests.length === availableMainGuests.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedMainGuests(availableMainGuests.map(g => g.id));
                                        } else {
                                            setSelectedMainGuests([]);
                                        }
                                    }}
                                />
                                <span className="text-sm font-medium text-stone-600">
                                    Selecionar todos ({availableMainGuests.length})
                                </span>
                            </div>

                            {availableMainGuests.map((guest) => (
                                <div
                                    key={guest.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                        selectedMainGuests.includes(guest.id)
                                            ? 'bg-rose-50 border-rose-200'
                                            : 'bg-white border-stone-200 hover:bg-stone-50'
                                    }`}
                                    onClick={() => handleSelectMainGuest(guest.id, !selectedMainGuests.includes(guest.id))}
                                >
                                    <Checkbox
                                        checked={selectedMainGuests.includes(guest.id)}
                                        onCheckedChange={(checked) => handleSelectMainGuest(guest.id, checked as boolean)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{guest.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {guest.group_name && (
                                                <span className="text-xs text-stone-500">{guest.group_name}</span>
                                            )}
                                            {guest.rsvp_status === 'confirmado' && (
                                                <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                                                    Confirmado
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DrawerFooter className="border-t pt-4 flex-row gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            onOpenChange(false);
                            setSelectedMainGuests([]);
                            setMainGuestSearch("");
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={selectedMainGuests.length === 0 || importGuestsFromMain.isPending}
                        className="flex-1 bg-rose-500 hover:bg-rose-600"
                        onClick={handleImportFromMainSubmit}
                    >
                        {importGuestsFromMain.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>Importar {selectedMainGuests.length > 0 && `(${selectedMainGuests.length})`}</>
                        )}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
