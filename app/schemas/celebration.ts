import { z } from "zod";

export const CelebrationEventSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["ceremony", "reception", "gathering", "celebration"]),
  title: z.string().min(1),
  starts_at: z.string().nullable(),
  venue_name: z.string().nullable(),
  address: z.string().nullable(),
  map_url: z.string().url().nullable().or(z.literal("")),
  dress_code: z.string().nullable(),
  schedule_note: z.string().nullable(),
  sort_order: z.number().int(),
  state: z.enum(["draft", "published", "archived"]),
});

export const InvitationEventSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  adult_limit: z.number().int().min(0).max(20),
  child_limit: z.number().int().min(0).max(20),
  confirmed_adults: z.number().int().min(0),
  confirmed_children: z.number().int().min(0),
  status: z.enum(["pendente", "confirmado", "recusado"]),
  private_message: z.string().nullable(),
});

export const PublicGiftSchema = z.object({
  id: z.string().uuid(),
  item_name: z.string().min(1),
  category: z.string().nullable(),
  suggested_store: z.string().nullable(),
  link: z.string().url().nullable().or(z.literal("")),
  price_range: z.string().nullable(),
  price_cents: z.number().int().positive().nullable(),
  image_url: z.string().url().nullable().or(z.literal("")),
  available: z.boolean(),
  reservation_id: z.string().uuid().nullable().optional(),
});

export const EventRsvpRequestSchema = z.object({
  eventResponses: z.array(z.object({
    eventId: z.string().uuid(),
    status: z.enum(["confirmado", "recusado"]),
    confirmedAdults: z.number().int().min(0).max(20),
    confirmedChildren: z.number().int().min(0).max(20),
    message: z.string().trim().max(1000).optional().default(""),
  })).min(1).max(10),
}).superRefine((value, context) => {
  const ids = new Set<string>();
  value.eventResponses.forEach((response, index) => {
    if (ids.has(response.eventId)) context.addIssue({ code: "custom", path: ["eventResponses", index, "eventId"], message: "Evento repetido." });
    ids.add(response.eventId);
    if (response.status === "confirmado" && response.confirmedAdults < 1) {
      context.addIssue({ code: "custom", path: ["eventResponses", index, "confirmedAdults"], message: "Informe ao menos um adulto." });
    }
  });
});

export const GeneralRsvpRequestSchema = z.object({
  generalResponse: z.object({
    status: z.enum(["confirmado", "recusado"]),
    confirmedAdults: z.number().int().min(0).max(20),
    confirmedChildren: z.number().int().min(0).max(20),
    message: z.string().trim().max(1000).optional().default(""),
  }),
}).superRefine((value, context) => {
  if (value.generalResponse.status === "confirmado" && value.generalResponse.confirmedAdults < 1) {
    context.addIssue({ code: "custom", path: ["generalResponse", "confirmedAdults"], message: "Informe ao menos um adulto." });
  }
});

export const RsvpRequestSchema = z.union([EventRsvpRequestSchema, GeneralRsvpRequestSchema]);

export const IdentifyGuestSchema = z.object({
  name: z.string().trim().min(3).max(120),
});

export const PublicRsvpRegistrationSchema = z.object({
  name: z.string().trim().min(3).max(120),
  status: z.enum(["confirmado", "recusado"]),
  confirmedAdults: z.number().int().min(0).max(20),
  confirmedChildren: z.number().int().min(0).max(20),
  message: z.string().trim().max(1000).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
}).superRefine((value, context) => {
  if (value.status === "confirmado" && value.confirmedAdults < 1) {
    context.addIssue({ code: "custom", path: ["confirmedAdults"], message: "Informe ao menos um adulto." });
  }
});

export const GiftReservationRequestSchema = z.object({ giftId: z.string().uuid() });
export const PixPayloadRequestSchema = z.object({
  reservationId: z.string().uuid().optional(),
  giftId: z.string().uuid().optional(),
}).refine((value) => !(value.reservationId && value.giftId), "Informe somente uma referência de presente.");

export type CelebrationEvent = z.infer<typeof CelebrationEventSchema>;
export type InvitationEvent = z.infer<typeof InvitationEventSchema>;
export type PublicGift = z.infer<typeof PublicGiftSchema>;
