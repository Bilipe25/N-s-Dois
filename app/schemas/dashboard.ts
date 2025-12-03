import { z } from "zod";

export const AppConfigSchema = z.object({
    id: z.string().uuid(),
    wedding_date: z.string().nullable(),
    home_photo_url: z.string().nullable(),
    logo_url: z.string().nullable(),
    created_at: z.string(),
});

export const TaskStatsSchema = z.object({
    pending: z.number().int().min(0),
    total: z.number().int().min(0),
});

export const GuestStatsSchema = z.object({
    confirmed: z.number().int().min(0),
    total: z.number().int().min(0),
});

export const BudgetStatsSchema = z.object({
    paid: z.number().min(0),
    estimated: z.number().min(0),
});

export const NextTaskSchema = z.object({
    title: z.string(),
}).nullable();

export const DashboardDataSchema = z.object({
    config: AppConfigSchema.nullable(),
    tasks: TaskStatsSchema,
    guests: GuestStatsSchema,
    budget: BudgetStatsSchema,
    nextTask: NextTaskSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type DashboardData = z.infer<typeof DashboardDataSchema>;
