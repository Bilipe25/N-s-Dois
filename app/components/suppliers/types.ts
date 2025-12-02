export interface Supplier {
    id: string;
    name: string;
    category: string;
    status: 'pesquisando' | 'negociando' | 'contratado' | 'pago';
    price?: number | null;
    contact_info?: string | null;
    photo_url?: string | null;
    contract_url?: string | null;
    rating?: number | null;
    notes?: string | null;
    created_at?: string;
    total_paid?: number; // Calculated field from budget integration
}

export const SUPPLIER_STATUSES = {
    pesquisando: { label: "Pesquisando", color: "bg-stone-100 text-stone-600 border-stone-200" },
    negociando: { label: "Negociando", color: "bg-amber-100 text-amber-700 border-amber-200" },
    contratado: { label: "Contratado", color: "bg-blue-100 text-blue-700 border-blue-200" },
    pago: { label: "Pago", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }
};

export const SUPPLIER_CATEGORIES = [
    { name: "Buffet", icon: "🍽️" },
    { name: "Decoração", icon: "💐" },
    { name: "Foto/Vídeo", icon: "📸" },
    { name: "Local", icon: "🏰" },
    { name: "Música", icon: "🎵" },
    { name: "Cerimonial", icon: "📋" },
    { name: "Doces/Bolo", icon: "🍰" },
    { name: "Roupas", icon: "👗" },
    { name: "Papelaria", icon: "💌" },
    { name: "Outros", icon: "✨" }
];
