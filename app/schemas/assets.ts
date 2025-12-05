import { z } from "zod";

// Categorias de bens
export const ASSET_CATEGORIES = [
    "Cozinha",
    "Sala",
    "Quarto",
    "Banheiro",
    "Lavanderia",
    "Escritório",
    "Varanda",
    "Garagem",
    "Decoração",
    "Eletrônicos",
    "Outros"
] as const;

export type AssetCategory = typeof ASSET_CATEGORIES[number];

// Schema principal do Asset
export const AssetSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Nome é obrigatório"),
    category: z.string(),
    value: z.number().min(0, "Valor deve ser positivo").nullable().optional(),
    notes: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    bridal_gift_id: z.string().nullable().optional(),
    created_at: z.string()
});

export type Asset = z.infer<typeof AssetSchema>;

// Schema para criar Asset
export const CreateAssetSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    category: z.string().default("Outros"),
    value: z.number().min(0, "Valor deve ser positivo").optional().default(0),
    notes: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    source: z.string().optional(),
    bridal_gift_id: z.string().nullable().optional()
});

export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;

// Schema para atualizar Asset
export const UpdateAssetSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    category: z.enum(ASSET_CATEGORIES).optional(),
    value: z.number().min(0).optional(),
    notes: z.string().nullable().optional(),
    photo_url: z.string().url().nullable().optional()
});

export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;
