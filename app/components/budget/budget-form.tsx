import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BUDGET_CATEGORIES, type BudgetItem, CreateBudgetItemSchema, type CreateBudgetItemInput, type CreateBudgetItemOutput, type BudgetCategory } from "@/schemas/budget";
import { useCreateBudgetItem, useUpdateBudgetItem } from "@/hooks/useBudget";

interface BudgetFormProps {
    item?: BudgetItem | null;
    suppliers: { id: string; name: string }[];
    onCancel: () => void;
}

export function BudgetForm({ item, suppliers, onCancel }: BudgetFormProps) {
    const isEditing = !!item;
    const [isInstallment, setIsInstallment] = useState(false);

    const createItem = useCreateBudgetItem();
    const updateItem = useUpdateBudgetItem();

    const form = useForm<CreateBudgetItemInput>({
        resolver: zodResolver(CreateBudgetItemSchema),
        defaultValues: {
            description: item?.description || "",
            category: item?.category || "Outros",
            estimated_value: item?.estimated_value || 0,
            paid_value: item?.paid_value || 0,
            installments_current: item?.installments_current || 1,
            installments_total: item?.installments_total || 1,
            due_date: item?.due_date || "",
            supplier_id: item?.supplier_id || null,
        }
    });

    useEffect(() => {
        if (item && item.installments_total > 1) {
            setIsInstallment(true);
        }
    }, [item]);

    const onSubmit = (data: CreateBudgetItemInput) => {
        if (isEditing && item) {
            updateItem.mutate({ id: item.id, ...data }, {
                onSuccess: onCancel
            });
        } else {
            createItem.mutate(data, {
                onSuccess: onCancel
            });
        }
    };

    const isPending = createItem.isPending || updateItem.isPending;

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                    id="description"
                    {...form.register("description")}
                    placeholder="Ex: Buffet, Fotógrafo..."
                />
                {form.formState.errors.description && (
                    <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                    onValueChange={(value) => form.setValue("category", value as any)}
                    defaultValue={form.getValues("category")}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {BUDGET_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.formState.errors.category && (
                    <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor (Opcional)</Label>
                <Select
                    onValueChange={(value) => form.setValue("supplier_id", value === "none" ? null : value)}
                    defaultValue={form.getValues("supplier_id") || "none"}
                >
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
                            type="number"
                            step="0.01"
                            className="pl-9"
                            placeholder="0,00"
                            {...form.register("estimated_value", { valueAsNumber: true })}
                        />
                    </div>
                    {form.formState.errors.estimated_value && (
                        <p className="text-xs text-destructive">{form.formState.errors.estimated_value.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paid_value">Valor Pago</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-stone-500 text-sm">R$</span>
                        <Input
                            id="paid_value"
                            type="number"
                            step="0.01"
                            className="pl-9"
                            placeholder="0,00"
                            {...form.register("paid_value", { valueAsNumber: true })}
                        />
                    </div>
                    {form.formState.errors.paid_value && (
                        <p className="text-xs text-destructive">{form.formState.errors.paid_value.message}</p>
                    )}
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
                            type="number"
                            min="1"
                            {...form.register("installments_current", { valueAsNumber: true })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="installments_total">Total de Parcelas</Label>
                        <Input
                            id="installments_total"
                            type="number"
                            min="1"
                            {...form.register("installments_total", { valueAsNumber: true })}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                    id="due_date"
                    type="date"
                    {...form.register("due_date")}
                />
            </div>

            <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-stone-900 text-white hover:bg-stone-800" disabled={isPending}>
                    {isPending ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Adicionar Gasto")}
                </Button>
            </div>
        </form>
    );
}
