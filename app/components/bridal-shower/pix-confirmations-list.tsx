import { usePixConfirmations } from "@/hooks/useBridalShower";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, DollarSign, Calendar, MessageSquare, Gift, User } from "lucide-react";

export function PixConfirmationsList() {
    const { data: confirmations = [], isLoading, error } = usePixConfirmations();

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
                <span className="ml-2 text-stone-500">Carregando confirmações...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-destructive">
                Ocorreu um erro ao carregar as confirmações de PIX.
            </div>
        );
    }

    if (confirmations.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhuma confirmação de PIX registrada ainda.
            </div>
        );
    }

    // Calculate total amount received
    const totalReceived = confirmations.reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Summary card */}
            <div className="bg-emerald-50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/20 flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Confirmado via PIX</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        R$ {totalReceived.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <DollarSign className="h-5 w-5" />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {confirmations.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-stone-200">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-4 w-4 text-stone-400" />
                                        <span className="font-semibold text-stone-900 dark:text-stone-100">{item.sender_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{formatDate(item.created_at)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                                        R$ {item.amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {item.gift_name && (
                                <div className="flex items-center gap-1.5 text-xs bg-stone-50 dark:bg-stone-900/40 p-2 rounded-lg border border-stone-100 dark:border-stone-800/40">
                                    <Gift className="h-3.5 w-3.5 text-rose-400" />
                                    <span className="text-muted-foreground">Presente:</span>
                                    <span className="font-medium text-stone-700 dark:text-stone-300">{item.gift_name}</span>
                                </div>
                            )}

                            {item.message && (
                                <div className="flex gap-2 text-sm text-stone-600 dark:text-stone-300 pt-1">
                                    <MessageSquare className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                                    <p className="italic bg-stone-50/50 dark:bg-stone-900/20 p-2.5 rounded-lg border border-dashed border-stone-100 w-full">
                                        "{item.message}"
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
