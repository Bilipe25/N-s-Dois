import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

interface BudgetSummaryProps {
    totalEstimated: number;
    totalPaid: number;
    progress: number;
}

export function BudgetSummary({ totalEstimated, totalPaid, progress }: BudgetSummaryProps) {
    const remaining = totalEstimated - totalPaid;

    return (
        <div className="grid grid-cols-1 gap-4">
            <Card className="bg-stone-900 text-white border-none shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-24 h-24" />
                </div>
                <CardContent className="p-6 space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-stone-400 text-sm font-medium mb-1">Total Pago</p>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h2>
                        </div>
                        <div className="bg-stone-800 p-2 rounded-lg">
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                <ArrowUpRight className="w-3 h-3" />
                                {progress.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-stone-400">
                            <span>Progresso do Orçamento</span>
                            <span>{totalEstimated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} total</span>
                        </div>
                        <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-800">
                        <div>
                            <p className="text-xs text-stone-500 mb-0.5">Restante</p>
                            <p className="text-sm font-semibold text-stone-300">
                                {remaining > 0
                                    ? remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                    : "R$ 0,00"
                                }
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 mb-0.5">Status</p>
                            <p className="text-sm font-semibold text-stone-300">
                                {progress >= 100 ? "Concluído" : "Em andamento"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
