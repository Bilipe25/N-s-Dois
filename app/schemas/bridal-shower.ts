import { z } from "zod";

export const GiftSchema = z.object({
    id: z.string().uuid(),
    item_name: z.string().min(1, "Nome do item é obrigatório"),
    category: z.string().nullable(),
    status: z.enum(["disponivel", "comprado"]),
    suggested_store: z.string().nullable(),
    link: z.string().url().nullable().or(z.literal("")),
    price_range: z.string().nullable(),
    image_url: z.string().url().nullable().or(z.literal("")),
    reserved_by: z.string().nullable(),
    reserved_at: z.string().nullable(),
    created_at: z.string()
});

export const GuestSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Nome é obrigatório"),
    phone: z.string().nullable(),
    confirmed: z.boolean(),
    created_at: z.string()
});

export const ConfigSchema = z.object({
    id: z.string().uuid(),
    bridal_shower_date: z.string().nullable(),
    bridal_shower_location: z.string().nullable(),
    bridal_shower_hero_url: z.string().nullable(),
    pix_key: z.string().nullable()
});

// Input Schemas for Mutations

export const ReserveGiftSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3, "Nome deve ter pelo menos 3 letras")
});

export const AddGiftSchema = z.object({
    item_name: z.string().min(1, "Nome do item é obrigatório"),
    category: z.string().optional(),
    suggested_store: z.string().optional(),
    link: z.string().optional(),
    price_range: z.string().optional(),
    image_url: z.string().optional()
});

export const UpdateGiftSchema = AddGiftSchema.partial().extend({
    id: z.string().uuid()
});

export const AddGuestSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    phone: z.string().optional()
});

export const UpdateConfigSchema = z.object({
    date: z.string().optional(),
    location: z.string().optional()
});

export type Gift = z.infer<typeof GiftSchema>;
export type Guest = z.infer<typeof GuestSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type ReserveGiftInput = z.infer<typeof ReserveGiftSchema>;
export type AddGiftInput = z.infer<typeof AddGiftSchema>;
export type AddGuestInput = z.infer<typeof AddGuestSchema>;
