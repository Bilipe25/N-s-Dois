import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Heart, Loader2 } from "lucide-react";
import { useConfirmPresence, useSearchBridalGuests } from "@/hooks/useBridalShower";
import { SuccessModal } from "./success-modal";
import { formatEventDate } from "./types";
import type { Config } from "@/schemas/bridal-shower";

interface ConfirmPresenceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config?: Config;
    isMobile: boolean;
}

export function ConfirmPresenceModal({ open, onOpenChange, config, isMobile }: ConfirmPresenceModalProps) {
    const { mutate: confirmPresence, isPending: isConfirming } = useConfirmPresence();

    const [guestName, setGuestName] = useState("");
    const [selectedLocation, setSelectedLocation] = useState<"local1" | "local2" | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState<{ guestName: string; locationName: string } | null>(null);

    // Server-side guest search with debounce
    const [debouncedQuery, setDebouncedQuery] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(guestName), 300);
        return () => clearTimeout(timer);
    }, [guestName]);
    const { data: suggestions = [] } = useSearchBridalGuests(debouncedQuery);

    const hasTwoLocations = config?.bridal_shower_location && config?.bridal_shower_location_2;

    // Auto-select location if only one is available
    useEffect(() => {
        if (open && config) {
            if (config.bridal_shower_location && !config.bridal_shower_location_2) {
                setSelectedLocation("local1");
            } else if (!config.bridal_shower_location && config.bridal_shower_location_2) {
                setSelectedLocation("local2");
            }
        }
    }, [open, config]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setGuestName("");
            setSelectedLocation(null);
            setShowSuggestions(false);
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim() || !selectedLocation) return;

        confirmPresence({ name: guestName, confirmed_location: selectedLocation }, {
            onSuccess: async (data) => {
                onOpenChange(false);
                setSuccessData({
                    guestName: data.guestName || guestName,
                    locationName: data.locationName || (selectedLocation === 'local1' ? config?.bridal_shower_location : config?.bridal_shower_location_2) || "Local"
                });
                setShowSuccess(true);
                try {
                    const { default: confetti } = await import("canvas-confetti");
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 },
                        colors: ['#f43f5e', '#fb7185', '#ffe4e6']
                    });
                } catch { /* confetti is non-critical */ }
            }
        });
    };

    // Shared form content — used by both Drawer (mobile) and Dialog (desktop)
    const formContent = (
        <div className="space-y-6">
            <div className="space-y-2 relative">
                <Label htmlFor="confirm-guest-name">Seu Nome Completo</Label>
                <Input
                    id="confirm-guest-name"
                    value={guestName}
                    onChange={(e) => {
                        setGuestName(e.target.value);
                        setShowSuggestions(e.target.value.length >= 2);
                    }}
                    onFocus={() => setShowSuggestions(guestName.length >= 2)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Digite seu nome..."
                    autoComplete="off"
                    required
                    className="h-11"
                />
                {showSuggestions && guestName.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {suggestions.length > 0 ? (
                            suggestions.map((guest) => (
                                <button
                                    key={guest.id}
                                    type="button"
                                    className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center justify-between text-sm"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setGuestName(guest.name);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <span>{guest.name}</span>
                                    {guest.confirmed && (
                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                            <Heart className="h-3 w-3 fill-green-600" /> Confirmado
                                        </span>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-stone-500">
                                Nenhum convidado encontrado. Você será adicionado à lista.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {hasTwoLocations ? (
                <div className="space-y-3">
                    <Label>Qual local você irá comparecer?</Label>
                    <RadioGroup value={selectedLocation || ""} onValueChange={(v: "local1" | "local2") => setSelectedLocation(v)} required>
                        <div className={`flex items-start space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${selectedLocation === 'local1' ? 'border-rose-500 bg-rose-50' : 'border-stone-200'}`}>
                            <RadioGroupItem value="local1" id="confirm-loc1" className="mt-1" />
                            <Label htmlFor="confirm-loc1" className="cursor-pointer w-full">
                                <div className="font-medium text-stone-900">{config?.bridal_shower_location || "Local 1"}</div>
                                <div className="text-xs text-stone-500 mt-1">
                                    {formatEventDate(config?.bridal_shower_date, 'short')}
                                </div>
                            </Label>
                        </div>
                        <div className={`flex items-start space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${selectedLocation === 'local2' ? 'border-rose-500 bg-rose-50' : 'border-stone-200'}`}>
                            <RadioGroupItem value="local2" id="confirm-loc2" className="mt-1" />
                            <Label htmlFor="confirm-loc2" className="cursor-pointer w-full">
                                <div className="font-medium text-stone-900">{config?.bridal_shower_location_2 || "Local 2"}</div>
                                <div className="text-xs text-stone-500 mt-1">
                                    {formatEventDate(config?.bridal_shower_date_2, 'short')}
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
            ) : (
                <div className="bg-stone-50 p-3 rounded-lg text-sm text-stone-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    Confirmando presença em: <strong>{config?.bridal_shower_location || "Local Principal"}</strong>
                </div>
            )}
        </div>
    );

    return (
        <>
            {isMobile ? (
                <Drawer open={open} onOpenChange={onOpenChange}>
                    <DrawerContent className="max-h-[85vh]">
                        <DrawerHeader className="text-left">
                            <DrawerTitle>Confirmar Presença</DrawerTitle>
                            <DrawerDescription>
                                Ficaremos muito felizes em ter você conosco! ❤️
                            </DrawerDescription>
                        </DrawerHeader>
                        <form onSubmit={handleSubmit} className="px-4 overflow-y-auto">
                            {formContent}
                            <DrawerFooter className="flex-row gap-2 px-0">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isConfirming} className="flex-1 bg-rose-500 hover:bg-rose-600">
                                    {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                                </Button>
                            </DrawerFooter>
                        </form>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={open} onOpenChange={onOpenChange}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Presença</DialogTitle>
                            <DialogDescription>
                                Ficaremos muito felizes em ter você conosco! ❤️
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="py-4">
                                {formContent}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isConfirming} className="bg-rose-500 hover:bg-rose-600">
                                    {isConfirming ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
                                    ) : "Confirmar Minha Presença"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <SuccessModal
                open={showSuccess}
                onOpenChange={setShowSuccess}
                isMobile={isMobile}
                icon={<Heart className="h-10 w-10 text-rose-500 fill-rose-500" />}
                iconBgClass="bg-rose-100"
                title="Presença Confirmada! 🎉"
                description={
                    <>
                        <strong>{successData?.guestName}</strong>, sua presença está confirmada para o Chá de Casa Nova em <strong>{successData?.locationName}</strong>!
                        <br /><br />
                        Estamos ansiosos para celebrar esse momento com você!
                    </>
                }
                buttonClassName="bg-rose-500 hover:bg-rose-600"
            />
        </>
    );
}
