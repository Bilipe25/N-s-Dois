import { CELEBRATION_TIME_ZONE } from "@/lib/celebration-time";
import type { Guest } from "@/schemas/guest";

function dayKey(value: string | number | Date, timeZone = CELEBRATION_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
}

export function respondedToday(value: string | null | undefined, now = new Date(), timeZone = CELEBRATION_TIME_ZONE) {
  if (!value) return false;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  return dayKey(date, timeZone) === dayKey(now, timeZone);
}

export function guestHasPrivateMessage(guest: Pick<Guest, "rsvp_message" | "event_responses">) {
  return Boolean(guest.rsvp_message?.trim() || guest.event_responses?.some((response) => response.private_message?.trim()));
}

export function formatRsvpTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CELEBRATION_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function latestResponseAt(guest: Pick<Guest, "rsvp_responded_at" | "event_responses">) {
  const candidates = [guest.rsvp_responded_at, ...(guest.event_responses || []).map((response) => response.responded_at)]
    .flatMap((value) => value ? [value] : [])
    .filter((value) => Number.isFinite(new Date(value).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return candidates[0] || null;
}

export function confirmedCounts(guest: Pick<Guest, "rsvp_status" | "rsvp_adults" | "rsvp_children" | "adults_count" | "children_count">) {
  if (guest.rsvp_status === "recusado") return { adults: 0, children: 0 };
  return {
    adults: guest.rsvp_adults ?? guest.adults_count ?? 0,
    children: guest.rsvp_children ?? guest.children_count ?? 0,
  };
}

export function guestLimitText(adults: number, children: number) {
  const adultLabel = adults === 1 ? "adulto" : "adultos";
  const childLabel = children === 1 ? "criança" : "crianças";
  return `${adults} ${adultLabel} e ${children} ${childLabel}`;
}
