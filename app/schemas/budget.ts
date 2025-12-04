import { z } from "zod";

export const BUDGET_CATEGORIES = [
    "Buffet",
    "Decoração",
    "Foto/Vídeo",
    "Local",
    "Roupas",
    "Música",
    "Cerimonial",
    "Doces/Bolo",
    "Papelaria",
    "Outros"
] as const;

export const BudgetItemSchema = z.object({
    id: z.string().uuid(),
    description: z.string().min(1, "A descrição é obrigatória"),
    category: z.enum(BUDGET_CATEGORIES),
    estimated_value: z.number().min(0, "O valor deve ser positivo"),
    paid_value: z.number().min(0, "O valor deve ser positivo"),
    status: z.enum(['pendente', 'parcial', 'pago', 'atrasado']),
    installments_current: z.number().int().min(1),
    installments_total: z.number().int().min(1),
    due_date: z.string().nullable().optional(),
    supplier_id: z.string().nullable().optional(),
    created_at: z.string(),
    suppliers: z.object({
        name: z.string()
    }).nullable().optional(),
});

export const CreateBudgetItemSchema = z.object({
    description: z.string().min(1, "A descrição é obrigatória"),
    category: z.enum(BUDGET_CATEGORIES),
    estimated_value: z.number().min(0, "O valor deve ser positivo"),
    paid_value: z.number().min(0, "O valor deve ser positivo").default(0),
    installments_current: z.number().int().min(1).default(1),
    installments_total: z.number().int().min(1).default(1),
    due_date: z.string().nullable().optional(),
    supplier_id: z.string().nullable().optional(),
});

export const UpdateBudgetItemSchema = CreateBudgetItemSchema.partial().extend({
    id: z.string().uuid(),
});

export type BudgetItem = z.infer<typeof BudgetItemSchema>;
export type CreateBudgetItemInput = z.input<typeof CreateBudgetItemSchema>;
export type UpdateBudgetItemInput = z.input<typeof UpdateBudgetItemSchema>;
