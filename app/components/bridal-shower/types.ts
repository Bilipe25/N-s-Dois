export {
    type Gift,
    type Guest,
    type GiftCategory,
    GIFT_CATEGORIES
} from "@/schemas/bridal-shower";

/**
 * Formata datas de evento de forma segura, tratando strings date-only
 * como horário local para evitar problemas de timezone (ex: "2026-07-15"
 * interpretada como UTC meia-noite, que no Brasil vira dia 14 às 21h).
 */
export function formatEventDate(dateStr: string | null | undefined, style: 'full' | 'short' = 'full'): string {
    if (!dateStr) return 'Data a definir';

    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    let date: Date;

    if (isDateOnly) {
        const [year, month, day] = dateStr.split('-').map(Number);
        date = new Date(year, month - 1, day);
    } else {
        date = new Date(dateStr);
    }

    if (isDateOnly) {
        return date.toLocaleDateString('pt-BR', { dateStyle: style });
    }

    return date.toLocaleString('pt-BR', { dateStyle: style, timeStyle: 'short' });
}
