import { z } from "zod";

export const InspirationLikeSchema = z.object({
    user_name: z.string()
});

export const InspirationCommentSchema = z.object({
    id: z.string().uuid(),
    user_name: z.string(),
    content: z.string(),
    created_at: z.string()
});

export const InspirationSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1, "Título é obrigatório"),
    category: z.string().min(1, "Categoria é obrigatória"),
    notes: z.string().nullable(),
    photo_url: z.string().url(),
    created_at: z.string(),
    inspiration_likes: z.array(InspirationLikeSchema),
    inspiration_comments: z.array(InspirationCommentSchema)
});

// Input Schemas

export const AddInspirationSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    category: z.string().min(1, "Categoria é obrigatória"),
    notes: z.string().optional(),
    photo: z.instanceof(File, { message: "Foto é obrigatória" })
});

export const EditInspirationSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1, "Título é obrigatório"),
    category: z.string().min(1, "Categoria é obrigatória"),
    notes: z.string().optional()
});

export const AddCommentSchema = z.object({
    inspirationId: z.string().uuid(),
    content: z.string().min(1, "Comentário não pode ser vazio")
});

export const ToggleLikeSchema = z.object({
    inspirationId: z.string().uuid(),
    hasLiked: z.boolean()
});

export type Inspiration = z.infer<typeof InspirationSchema>;
export type InspirationLike = z.infer<typeof InspirationLikeSchema>;
export type InspirationComment = z.infer<typeof InspirationCommentSchema>;
export type AddInspirationInput = z.infer<typeof AddInspirationSchema>;
export type EditInspirationInput = z.infer<typeof EditInspirationSchema>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
export type ToggleLikeInput = z.infer<typeof ToggleLikeSchema>;
