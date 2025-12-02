import { useState, useEffect } from "react";
import { Form } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BUDGET_CATEGORIES, type BudgetItem } from "./types";

interface BudgetFormProps {
    item?: BudgetItem | null;
    suppliers: { id: string; name: string }[];
    onCancel: () => void;
}

export function BudgetForm({ item, suppliers, onCancel }: BudgetFormProps) {
    const isEditing = !!item;
    const [isInstallment, setIsInstallment] = useState(false);

    useEffect(() => {
        if (item && item.installments_total > 1) {
            setIsInstallment(true);
        }
    }, [item]);

    return (
        <Form method="post" className="space-y-4" onSubmit={onCancel}>
            {isEditing && <input type="hidden" name="id" value={item.id} />}

            <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                    id="description"
                    name="description"
                    placeholder="Ex: Buffet, Fotógrafo..."
                    defaultValue={item?.description}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select name="category" defaultValue={item?.category} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {BUDGET_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor (Opcional)</Label>
                <Select name="supplier_id" defaultValue={item?.supplier_id || "none"}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="estimated_value">Valor Orçado</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-stone-500 text-sm">R$</span>
                        <Input
                            id="estimated_value"
                            name="estimated_value"
                            type="number"
                            step="0.01"
                            className="pl-9"
                            placeholder="0,00"
                            defaultValue={item?.estimated_value}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paid_value">Valor Pago</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-stone-500 text-sm">R$</span>
                        <Input
                            id="paid_value"
                            name="paid_value"
                            type="number"
                            step="0.01"
                            className="pl-9"
                            placeholder="0,00"
                            defaultValue={item?.paid_value}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
                <Checkbox
                    id="is_installment"
                    checked={isInstallment}
                    onCheckedChange={(checked) => setIsInstallment(checked as boolean)}
                />
                <Label htmlFor="is_installment" className="font-normal cursor-pointer">
                    Compra Parcelada?
                </Label>
            </div>

            {isInstallment && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in">
                    <div className="space-y-2">
                        <Label htmlFor="installments_current">Parcela Atual</Label>
                        <Input
                            id="installments_current"
                            name="installments_current"
                            type="number"
                            min="1"
                            defaultValue={item?.installments_current || 1}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="installments_total">Total de Parcelas</Label>
                        <Input
                            id="installments_total"
                            name="installments_total"
                            type="number"
                            min="1"
                            defaultValue={item?.installments_total || 1}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    defaultValue={item?.due_date ? new Date(item.due_date).toISOString().split('T')[0] : ''}
                />
            </div>

            <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" name="intent" value={isEditing ? "update" : "add"} className="flex-1 bg-stone-900 text-white hover:bg-stone-800">
                    {isEditing ? "Salvar Alterações" : "Adicionar Gasto"}
                </Button>
            </div>
        </Form>
    );
}
