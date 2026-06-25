import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, AlertCircle, Coins, HeartHandshake } from "lucide-react";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { generatePixPayload } from "@/lib/pix";
import { PixConfirmationForm } from "./pix-confirmation-form";

interface PixModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pixKey?: string | null;
    pixRecipientName?: string | null;
    pixCity?: string | null;
    giftId?: string | null;
    giftName?: string | null;
    suggestedValue?: number | null;
    isMobile?: boolean;
}

export function PixModal({
    open,
    onOpenChange,
    pixKey,
    pixRecipientName,
    pixCity,
    giftId,
    giftName,
    suggestedValue,
    isMobile = false
}: PixModalProps) {
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState<"pix" | "confirm">("pix");
    const [amount, setAmount] = useState<string>("");

    const hasPixKey = Boolean(pixKey && pixKey.trim().length > 0);

    // Reset step and amount when modal opens/changes gift context
    useEffect(() => {
        if (open) {
            setStep("pix");
            setAmount(suggestedValue ? suggestedValue.toString() : "");
        }
    }, [open, suggestedValue]);

    // Recipient and City settings with fallbacks
    const recipient = pixRecipientName || "Gabriel Felipe Lisboa dos Santos";
    const city = pixCity || "Campo do Brito - SE";

    // Generate EMV Payload dynamically based on the current amount
    const parsedAmount = parseFloat(amount);
    const payload = hasPixKey && pixKey
        ? generatePixPayload({
            pixKey,
            recipientName: recipient,
            city,
            amount: !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : undefined,
            txId: "CHADECASANOVA"
        })
        : "";

    const handleCopy = () => {
        if (!payload) return;
        navigator.clipboard.writeText(payload).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = payload;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                prompt("Copie o código PIX Copia e Cola:", payload);
            }
        });
    };

    const content = (
        <div className="space-y-4 py-2">
            {hasPixKey && pixKey ? (
                step === "pix" ? (
                    <div className="flex flex-col items-center gap-4">
                        {giftName && (
                            <div className="bg-rose-50/50 dark:bg-rose-950/10 p-3 rounded-xl border border-rose-100 dark:border-rose-950/20 w-full text-center">
                                <span className="text-xs text-rose-500 font-semibold flex items-center justify-center gap-1">
                                    <HeartHandshake className="h-3.5 w-3.5" /> Presente Selecionado
                                </span>
                                <p className="font-medium text-foreground text-sm mt-0.5">{giftName}</p>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div className="w-full space-y-1">
                            <Label htmlFor="pixAmount" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                Valor da Contribuição (R$)
                            </Label>
                            <Input
                                id="pixAmount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="Digite o valor (ex: 50.00)"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-11 text-center text-lg font-semibold bg-stone-50/50"
                            />
                        </div>

                        {/* QR Code Container */}
                        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center gap-2">
                            <QRCode
                                value={payload}
                                size={170}
                                bgColor="#ffffff"
                                fgColor="#1c1917"
                                level="M"
                            />
                            <span className="text-[10px] text-stone-400 font-mono mt-1">PIX BR Code V1.0</span>
                        </div>

                        {/* Recebedor Details */}
                        <div className="bg-stone-50/60 dark:bg-stone-900/40 px-4 py-2 rounded-xl border border-stone-100 dark:border-stone-800/40 w-full text-xs space-y-0.5">
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Recebedor:</span>
                                <span className="font-semibold text-foreground">{recipient}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Cidade:</span>
                                <span className="font-semibold text-foreground">{city}</span>
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="w-full space-y-2 pt-2">
                            <Button
                                onClick={handleCopy}
                                className={`w-full h-11 text-sm font-medium transition-all ${copied ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-stone-950 hover:bg-stone-900 text-white'}`}
                            >
                                {copied ? (
                                    <><Check className="mr-2 h-4 w-4" /> PIX Copiado!</>
                                ) : (
                                    <><Copy className="mr-2 h-4 w-4" /> Copiar PIX Copia e Cola</>
                                )}
                            </Button>

                            <Button
                                onClick={() => setStep("confirm")}
                                variant="outline"
                                className="w-full h-11 text-sm font-medium border-emerald-500/30 text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 flex items-center justify-center gap-1.5"
                            >
                                <Coins className="h-4 w-4" /> Já fiz o PIX! Confirmar Presente
                            </Button>
                        </div>
                    </div>
                ) : (
                    <PixConfirmationForm
                        giftId={giftId}
                        giftName={giftName}
                        suggestedValue={parsedAmount > 0 ? parsedAmount : suggestedValue}
                        onSuccess={() => {
                            onOpenChange(false);
                            setStep("pix");
                        }}
                        onCancel={() => setStep("pix")}
                    />
                )
            ) : (
                <div className="text-center py-4 space-y-3">
                    <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-stone-400" />
                    </div>
                    <p className="text-stone-500 text-sm">
                        A chave Pix ainda não foi configurada. Entre em contato com os noivos.
                    </p>
                </div>
            )}
        </div>
    );

    const title = step === "pix" ? "Presente Virtual (Pix)" : "Confirmar Envio do PIX";
    const description = step === "pix"
        ? "Escaneie o QR Code abaixo com seu app do banco ou use o botão para copiar o código Copia e Cola. ❤️"
        : "Para que possamos saber que você enviou esse presente e podermos agradecer, preencha a confirmação rápida abaixo:";

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="max-h-[92vh]">
                    <DrawerHeader className="pb-2">
                        <DrawerTitle className="text-center font-serif text-2xl text-stone-800 dark:text-stone-200">{title}</DrawerTitle>
                        <DrawerDescription className="text-center text-xs">{description}</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-8 overflow-y-auto">
                        {content}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center font-serif text-2xl text-stone-800 dark:text-stone-200">{title}</DialogTitle>
                    <DialogDescription className="text-center pt-2 text-xs">{description}</DialogDescription>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
}

