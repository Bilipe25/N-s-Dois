import { z } from "zod";

export const AppConfigSchema = z.object({
    id: z.string().uuid(),
    wedding_date: z.string().nullable().optional(),
    wedding_address: z.string().nullable().optional(),
    login_photo_url: z.string().nullable().optional(),
    home_photo_url: z.string().nullable().optional(),
    bridal_shower_hero_url: z.string().nullable().optional(),
    logo_url: z.string().nullable().optional(),
    created_at: z.string(),
});

export const UpdateConfigSchema = z.object({
    wedding_date: z.string().optional(),
    wedding_address: z.string().optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type UpdateConfigInput = z.infer<typeof UpdateConfigSchema>;
