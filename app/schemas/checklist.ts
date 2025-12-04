import { z } from "zod";

export const SubtaskSchema = z.object({
    title: z.string().min(1, "O título da subtarefa é obrigatório"),
    done: z.boolean().default(false),
});

export const AttachmentSchema = z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string().optional(),
    size: z.number().optional(),
    created_at: z.string().optional(),
});

export const ChecklistItemSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1, "O título é obrigatório"),
    status: z.enum(["pendente", "concluido"]).default("pendente"),
    category: z.string().default("geral"),
    due_date: z.string().nullable().optional(),
    assigned_to: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    subtasks: z.array(SubtaskSchema).default([]),
    attachments: z.array(AttachmentSchema).default([]),
    created_at: z.string(),
    user_id: z.string().uuid(),
});

export const CreateChecklistItemSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    category: z.string().default("geral"),
    due_date: z.string().nullable().optional(),
    assigned_to: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

export const UpdateChecklistItemSchema = z.object({
    title: z.string().min(1, "O título é obrigatório").optional(),
    status: z.enum(["pendente", "concluido"]).optional(),
    category: z.string().optional(),
    due_date: z.string().nullable().optional(),
    assigned_to: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    subtasks: z.array(SubtaskSchema).optional(),
    attachments: z.array(AttachmentSchema).optional(),
});

export type Subtask = z.infer<typeof SubtaskSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type CreateChecklistItemInput = z.input<typeof CreateChecklistItemSchema>;
export type UpdateChecklistItemInput = z.input<typeof UpdateChecklistItemSchema>;
