import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, PartyPopper } from "lucide-react";
import { useReserveGift } from "@/hooks/useBridalShower";
import { SuccessModal } from "./success-modal";
import type { Gift } from "@/schemas/bridal-shower";

interface ReserveGiftModalProps {
    gift: Gift | null;
    onClose: () => void;
    isMobile: boolean;
}

export function ReserveGiftModal({ gift, onClose, isMobile }: ReserveGiftModalProps) {
    const { mutate: reserveGift, isPending: isReserving } = useReserveGift();
    const [guestName, setGuestName] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState<{ giftName: string; guestName: string; verse: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gift || !guestName.trim()) return;

        reserveGift({ id: gift.id, name: guestName }, {
            onSuccess: async (data) => {
                setSuccessData({
                    giftName: data.giftName,
                    guestName: data.guestName,
                    verse: data.verse
                });
                onClose();
                setGuestName("");
                setShowSuccess(true);
                try {
                    const { default: confetti } = await import("canvas-confetti");
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                } catch { /* confetti is non-critical */ }
            }
        });
    };

    const handleClose = () => {
        onClose();
        setGuestName("");
    };

    const formInput = (
        <Input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Seu Nome Completo"
            required
            className="h-12 text-lg"
        />
    );

    return (
        <>
            {isMobile ? (
                <Drawer open={!!gift} onOpenChange={(open) => !open && handleClose()}>
                    <DrawerContent>
                        <DrawerHeader className="text-left">
                            <DrawerTitle>Confirmar Presente</DrawerTitle>
                            <DrawerDescription>
                                Que legal! Você escolheu presentear com: <strong>{gift?.item_name}</strong>.
                                Por favor, informe seu nome para marcarmos como reservado.
                            </DrawerDescription>
                        </DrawerHeader>
                        <form onSubmit={handleSubmit} className="px-4">
                            <div className="space-y-4">
                                {formInput}
                            </div>
                            <DrawerFooter className="flex-row gap-2 px-0">
                                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
                                <Button type="submit" disabled={isReserving} className="flex-1 bg-rose-500 hover:bg-rose-600">
                                    {isReserving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                                </Button>
                            </DrawerFooter>
                        </form>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={!!gift} onOpenChange={(open) => !open && handleClose()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Presente</DialogTitle>
                            <DialogDescription>
                                Que legal! Você escolheu presentear com: <strong>{gift?.item_name}</strong>.
                                Por favor, informe seu nome para marcarmos como reservado.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="py-4 space-y-4">
                                {formInput}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                                <Button type="submit" disabled={isReserving} className="bg-rose-500 hover:bg-rose-600">
                                    {isReserving ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
                                    ) : "Confirmar Reserva"}
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
                icon={<PartyPopper className="h-10 w-10 text-green-600" />}
                iconBgClass="bg-green-100"
                title={`Obrigado, ${successData?.guestName}! ❤️`}
                description={
                    <>
                        Sua reserva do presente <strong>{successData?.giftName}</strong> foi confirmada com sucesso.
                        <br /><br />
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 italic text-stone-500 text-sm">
                            &ldquo;{successData?.verse}&rdquo;
                        </div>
                    </>
                }
            />
        </>
    );
}
