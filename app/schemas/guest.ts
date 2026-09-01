import { z } from "zod";
import { GuestInviteMetadataSchema } from "./invite";

export const GuestEventResponseAdminSchema = z.object({
    id: z.string().uuid(),
    event_id: z.string().uuid(),
    event_title: z.string().min(1),
    event_starts_at: z.string().nullable(),
    status: z.enum(["pendente", "confirmado", "recusado"]),
    adult_limit: z.number().int().min(0),
    child_limit: z.number().int().min(0),
    confirmed_adults: z.number().int().min(0),
    confirmed_children: z.number().int().min(0),
    private_message: z.string().nullable(),
    responded_at: z.string().nullable(),
});

export const GuestSchema = z.object({
    id: z.string().uuid(),
    created_at: z.string(),
    name: z.string().min(1, "Nome é obrigatório"),
    group_name: z.string().min(1, "Grupo é obrigatório"),
    adults_count: z.number().int().min(0),
    children_count: z.number().int().min(0),
    rsvp_status: z.enum(["pendente", "confirmado", "recusado"]),
    phone: z.string().nullable().optional(),
    reserved_gifts: z.array(z.object({
        id: z.string().uuid(),
        item_name: z.string().min(1),
    })).optional().default([]),
    source: z.enum(["admin", "public_rsvp"]).optional().default("admin"),
    review_status: z.enum(["pending", "approved"]).optional().default("approved"),
    rsvp_adults: z.number().int().min(0).nullable().optional(),
    rsvp_children: z.number().int().min(0).nullable().optional(),
    rsvp_message: z.string().nullable().optional(),
    rsvp_responded_at: z.string().nullable().optional(),
    event_responses: z.array(GuestEventResponseAdminSchema).optional().default([]),
    invite: GuestInviteMetadataSchema.nullable().optional(),
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
export type GuestEventResponseAdmin = z.infer<typeof GuestEventResponseAdminSchema>;
export type AddGuestInput = z.infer<typeof AddGuestSchema>;
export type UpdateGuestInput = z.infer<typeof UpdateGuestSchema>;
export type UpdateRSVPInput = z.infer<typeof UpdateRSVPSchema>;
export type BulkActionInput = z.infer<typeof BulkActionSchema>;
