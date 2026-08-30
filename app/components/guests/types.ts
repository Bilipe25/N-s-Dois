export interface Guest {
    id: string;
    name: string;
    group_name: string;
    adults_count: number;
    children_count: number;
    rsvp_status: "pendente" | "confirmado" | "recusado";
    created_at: string;
    phone?: string | null;
    invite?: {
        active: true;
        created_at: string;
        last_used_at: string | null;
    } | null;
}

export type GuestFilter = "todos" | "confirmado" | "pendente" | "recusado";

export interface GuestGroupStats {
    name: string;
    count: number;
    confirmed: number;
}
