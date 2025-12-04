import { z } from "zod";

export const NotificationSchema = z.object({
    id: z.string().uuid(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    link: z.string().optional().nullable(),
    read: z.boolean().default(false),
    created_at: z.string(),
    user_id: z.string().uuid().optional().nullable(),
});

export const CreateNotificationSchema = z.object({
    type: z.string(),
    title: z.string(),
    message: z.string(),
    link: z.string().optional(),
    user_id: z.string().uuid().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type CreateNotificationInput = z.input<typeof CreateNotificationSchema>;
