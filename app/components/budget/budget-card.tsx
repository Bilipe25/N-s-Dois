import { useState } from "react";
import { useFetcher, Link } from "react-router";
import { MoreHorizontal, Pencil, Trash2, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { BudgetItem } from "./types";

interface BudgetCardProps {
    item: BudgetItem;
    onEdit: (item: BudgetItem) => void;
}

export function BudgetCard({ item, onEdit }: BudgetCardProps) {
    const fetcher = useFetcher();
    const isDeleting = fetcher.formData?.get("intent") === "delete" && fetcher.formData.get("id") === item.id;

    if (isDeleting) return null;

    const progress = item.estimated_value > 0 ? (item.paid_value / item.estimated_value) * 100 : 0;

    // Status Logic
    let statusColor = "bg-stone-100 text-stone-600";
    let statusIcon = null;

    if (item.status === 'pago') {
        statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
        statusIcon = <CheckCircle2 className="w-3 h-3 mr-1" />;
    } else if (item.status === 'atrasado') {
        statusColor = "bg-red-100 text-red-700 border-red-200";
        statusIcon = <AlertCircle className="w-3 h-3 mr-1" />;
    } else if (item.status === 'parcial') {
        statusColor = "bg-blue-50 text-blue-700 border-blue-200";
    }

    // Date formatting
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-stone-500 border-stone-200">
                                {item.category}
                            </Badge>
                            {item.installments_total > 1 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-stone-100 text-stone-600">
                                    {item.installments_current}/{item.installments_total}
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-semibold text-stone-900 leading-tight">{item.description}</h3>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 text-stone-400">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="text-red-600 focus:text-red-600">
                                <fetcher.Form method="post">
                                    <input type="hidden" name="id" value={item.id} />
                                    <button type="submit" name="intent" value="delete" className="flex w-full items-center">
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                    </button>
                                </fetcher.Form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-xs text-stone-500 mb-0.5">Pago</p>
                        <p className="text-lg font-bold text-stone-900">
                            {item.paid_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-stone-500 mb-0.5">Orçado</p>
                        <p className="text-sm font-medium text-stone-600">
                            {item.estimated_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>

                <Progress value={progress} className="h-1.5 mb-3" indicatorClassName={progress >= 100 ? "bg-emerald-500" : "bg-blue-500"} />

                <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                    <div className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColor}`}>
                        {statusIcon}
                        <span className="capitalize">{item.status}</span>
                    </div>

                    {item.due_date && (
                        <div className="flex items-center text-xs text-stone-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(item.due_date)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
