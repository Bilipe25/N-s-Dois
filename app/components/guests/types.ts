export type { Guest } from "@/schemas/guest";

export type GuestFilter = "todos" | "confirmado" | "pendente" | "recusado" | "public_rsvp" | "confirmed_today" | "with_message";

export interface GuestGroupStats {
    name: string;
    count: number;
    confirmed: number;
}
