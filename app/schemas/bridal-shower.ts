import { z } from "zod";

export const GIFT_CATEGORIES = [
    "Cozinha",
    "Banheiro",
    "Quarto",
    "Sala",
    "Lavanderia",
    "Decoração",
    "Outros"
] as const;

export type GiftCategory = typeof GIFT_CATEGORIES[number];

// --- DOMAIN SCHEMAS (OUTPUT) ---

export const GiftSchema = z.object({
    id: z.string().uuid(),
    item_name: z.string().min(1, "Nome do item é obrigatório"),
    category: z.enum(GIFT_CATEGORIES).nullable().optional(),
    status: z.enum(["disponivel", "comprado"]),
    suggested_store: z.string().nullable().optional(),
    link: z.string().url().nullable().optional().or(z.literal("")),
    price_range: z.string().nullable().optional(),
    image_url: z.string().url().nullable().optional().or(z.literal("")),
    reserved_by: z.string().nullable().optional(),
    reserved_at: z.string().nullable().optional(),
    created_at: z.string()
});

export const GuestSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Nome é obrigatório"),
    phone: z.string().nullable().optional(),
    confirmed: z.boolean(),
    confirmed_location: z.enum(["local1", "local2"]).nullable().optional(),
    created_at: z.string()
});

export const ConfigSchema = z.object({
    id: z.string().uuid(),
    bridal_shower_date: z.string().nullable().optional(),
    bridal_shower_location: z.string().nullable().optional(),
    bridal_shower_address_1: z.string().nullable().optional(),
    bridal_shower_map_link_1: z.string().nullable().optional(),
    bridal_shower_date_2: z.string().nullable().optional(),
    bridal_shower_location_2: z.string().nullable().optional(),
    bridal_shower_address_2: z.string().nullable().optional(),
    bridal_shower_map_link_2: z.string().nullable().optional(),
    bridal_shower_hero_url: z.string().nullable().optional(),
    pix_key: z.string().nullable().optional(),
    contact_phone_gabriel: z.string().nullable().optional(),
    contact_phone_raabe: z.string().nullable().optional(),
    bridal_shower_show_links: z.boolean().nullable().optional(),
    bridal_shower_show_prices: z.boolean().nullable().optional()
});

// --- INPUT SCHEMAS (MUTATIONS) ---

export const ReserveGiftSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3, "Nome deve ter pelo menos 3 letras"),
    confirmed_location: z.enum(["local1", "local2"]).optional()
});

export const ConfirmPresenceSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    confirmed_location: z.enum(["local1", "local2"])
});

export const CreateGiftSchema = z.object({
    item_name: z.string().min(1, "Nome do item é obrigatório"),
    category: z.enum(GIFT_CATEGORIES).optional().default("Outros"),
    suggested_store: z.string().optional(),
    link: z.string().optional(),
    price_range: z.string().optional(),
    image_url: z.string().optional()
});

export const UpdateGiftSchema = CreateGiftSchema.partial().extend({
    id: z.string().uuid()
});

export const CreateGuestSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    phone: z.string().optional(),
    confirmed_location: z.enum(["local1", "local2"]).optional()
});

export const UpdateConfigSchema = z.object({
    date: z.string().optional(),
    location: z.string().optional(),
    address_1: z.string().optional(),
    map_link_1: z.string().optional(),
    date_2: z.string().optional(),
    location_2: z.string().optional(),
    address_2: z.string().optional(),
    map_link_2: z.string().optional(),
    hero_url: z.string().optional(),
    pix_key: z.string().optional(),
    contact_phone_gabriel: z.string().optional(),
    contact_phone_raabe: z.string().optional(),
    show_links: z.boolean().optional(),
    show_prices: z.boolean().optional()
});

export const BulkUpdateCategorySchema = z.object({
    ids: z.array(z.string().uuid()),
    category: z.enum(GIFT_CATEGORIES)
});

// --- TYPES ---

export type Gift = z.infer<typeof GiftSchema>;
export type Guest = z.infer<typeof GuestSchema>;
export type Config = z.infer<typeof ConfigSchema>;

export type ReserveGiftInput = z.input<typeof ReserveGiftSchema>;

export type ConfirmPresenceInput = z.input<typeof ConfirmPresenceSchema>;

export type CreateGiftInput = z.input<typeof CreateGiftSchema>;
export type CreateGiftOutput = z.infer<typeof CreateGiftSchema>;

export type UpdateGiftInput = z.input<typeof UpdateGiftSchema>;

export type CreateGuestInput = z.input<typeof CreateGuestSchema>;
export type CreateGuestOutput = z.infer<typeof CreateGuestSchema>;

export type UpdateConfigInput = z.input<typeof UpdateConfigSchema>;
export type BulkUpdateCategoryInput = z.input<typeof BulkUpdateCategorySchema>;
