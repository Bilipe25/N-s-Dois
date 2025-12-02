export interface BudgetItem {
    id: string;
    created_at?: string;
    description: string;
    category: string;
    estimated_value: number;
    paid_value: number;
    status: 'pendente' | 'parcial' | 'pago' | 'atrasado';
    installments_current: number;
    installments_total: number;
    due_date?: string | null;
}

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

export type BudgetCategory = typeof BUDGET_CATEGORIES[number];
