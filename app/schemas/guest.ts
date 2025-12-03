import { z } from "zod";

export const GuestSchema = z.object({
    id: z.string().uuid(),
    created_at: z.string(),
    name: z.string().min(1, "Nome é obrigatório"),
    group_name: z.string().min(1, "Grupo é obrigatório"),
    adults_count: z.number().int().min(1),
    children_count: z.number().int().min(0),
    rsvp_status: z.enum(["pendente", "confirmado", "recusado"]),
    phone: z.string().nullable().optional(),
});

// Input Schemas

export const AddGuestSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"), // Can be multiline string for multiple guests
    group_name: z.string().min(1, "Grupo é obrigatório"),
    adults_count: z.number().int().min(1).default(1),
    children_count: z.number().int().min(0).default(0),
});

export const UpdateGuestSchema = z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    group_name: z.string().optional(),
    adults_count: z.number().int().optional(),
    children_count: z.number().int().optional(),
    rsvp_status: z.enum(["pendente", "confirmado", "recusado"]).optional(),
});

export const UpdateRSVPSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(["pendente", "confirmado", "recusado"]),
});

export const BulkActionSchema = z.object({
    ids: z.array(z.string().uuid()),
});

export type Guest = z.infer<typeof GuestSchema>;
export type AddGuestInput = z.infer<typeof AddGuestSchema>;
export type UpdateGuestInput = z.infer<typeof UpdateGuestSchema>;
export type UpdateRSVPInput = z.infer<typeof UpdateRSVPSchema>;
export type BulkActionInput = z.infer<typeof BulkActionSchema>;
