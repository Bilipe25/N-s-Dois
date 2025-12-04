import { z } from "zod";

export const GroomsmanSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "O nome é obrigatório"),
    role: z.enum(["padrinho", "madrinha", "daminha", "pajem"]),
    side: z.enum(["noivo", "noiva"]),
    photo_url: z.string().nullable().optional(),
    created_at: z.string().optional(),
});

export const CreateGroomsmanSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    role: z.enum(["padrinho", "madrinha", "daminha", "pajem"]),
    side: z.enum(["noivo", "noiva"]),
    photo: z.any().optional(), // File object handling is tricky in Zod for client-side, usually handled separately or as any
});

export const UpdateGroomsmanSchema = GroomsmanSchema.pick({
    name: true,
    role: true,
    side: true,
}).extend({
    id: z.string().uuid(),
    photo: z.any().optional(),
});

export type Groomsman = z.infer<typeof GroomsmanSchema>;
export type CreateGroomsmanInput = z.infer<typeof CreateGroomsmanSchema>;
export type UpdateGroomsmanInput = z.infer<typeof UpdateGroomsmanSchema>;
