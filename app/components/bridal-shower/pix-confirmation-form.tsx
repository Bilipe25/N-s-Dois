import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmPix } from "@/hooks/useBridalShower";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface PixConfirmationFormProps {
    giftId?: string | null;
    giftName?: string | null;
    suggestedValue?: number | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function PixConfirmationForm({
    giftId,
    giftName,
    suggestedValue,
    onSuccess,
    onCancel
}: PixConfirmationFormProps) {
    const [senderName, setSenderName] = useState("");
    const [message, setMessage] = useState("");
    const [amount, setAmount] = useState(suggestedValue ? suggestedValue.toString() : "");
    const confirmPix = useConfirmPix();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!senderName.trim()) {
            toast.error("Por favor, informe seu nome.");
            return;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error("Por favor, insira um valor válido maior que zero.");
            return;
        }

        try {
            await confirmPix.mutateAsync({
                sender_name: senderName,
                message: message.trim() || undefined,
                amount: numericAmount,
                gift_id: giftId || null,
                gift_name: giftName || null
            });
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
            toast.success("Confirmação enviada com sucesso! Muito obrigado! ❤️");
            onSuccess();
        } catch (err) {
            // Error is already toasted by the hook
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
                <Label htmlFor="senderName">Seu Nome *</Label>
                <Input
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ex: Maria Souza"
                    required
                    disabled={confirmPix.isPending}
                />
            </div>

            <div className="space-y-1">
                <Label htmlFor="amount">Valor Enviado (R$) *</Label>
                <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 50.00"
                    required
                    disabled={confirmPix.isPending}
                />
                {suggestedValue && (
                    <p className="text-xs text-muted-foreground">
                        Valor sugerido para o presente: <strong>R$ {suggestedValue.toFixed(2)}</strong>
                    </p>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <Label htmlFor="message">Mensagem para os Noivos</Label>
                    <span className="text-xs text-muted-foreground">Opcional</span>
                </div>
                <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Deixe uma mensagem carinhosa..."
                    rows={3}
                    disabled={confirmPix.isPending}
                />
            </div>

            {giftName && (
                <div className="bg-secondary/50 p-2.5 rounded-lg text-xs space-y-1">
                    <span className="text-muted-foreground font-semibold">Presente Vinculado:</span>
                    <p className="font-medium text-foreground">{giftName}</p>
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={confirmPix.isPending}
                >
                    Voltar
                </Button>
                <Button
                    type="submit"
                    disabled={confirmPix.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                    {confirmPix.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirmando...
                        </>
                    ) : (
                        "Confirmar Envio"
                    )}
                </Button>
            </div>
        </form>
    );
}
