import { z } from "zod";

export const CreateInviteLinkActionSchema = z.object({
  intent: z.literal("create_invite_link"),
  id: z.string().uuid(),
});

export const RotateInviteLinkActionSchema = z.object({
  intent: z.literal("rotate_invite_link"),
  id: z.string().uuid(),
  confirmed: z.literal(true),
});

export const GuestInviteMetadataSchema = z.object({
  active: z.literal(true),
  created_at: z.string(),
  last_used_at: z.string().nullable(),
});

export type GuestInviteMetadata = z.infer<typeof GuestInviteMetadataSchema>;
