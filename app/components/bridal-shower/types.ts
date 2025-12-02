export interface Gift {
    id: string;
    created_at: string;
    item_name: string;
    suggested_store: string | null;
    price_range: string | null;
    link: string | null;
    status: 'disponivel' | 'comprado';
    reserved_by: string | null;
    reserved_at: string | null;
    category: string | null;
    image_url: string | null;
}

export interface Guest {
    id: string;
    created_at?: string;
    name: string;
    phone?: string | null;
    confirmed: boolean;
}

export const GIFT_CATEGORIES = [
    "Cozinha",
    "Mesa Posta",
    "Banho",
    "Cama",
    "Decoração",
    "Eletro",
    "Lavanderia",
    "Outros"
] as const;

export type GiftCategory = typeof GIFT_CATEGORIES[number];
