import type { CelebrationEvent } from "@/schemas/celebration";

export const CELEBRATION_LIVE_WINDOW_MS = 12 * 60 * 60 * 1000;
export const CELEBRATION_TIME_ZONE = "America/Fortaleza";

export function formatCelebrationDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CELEBRATION_TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getCelebrationPhase(events: Pick<CelebrationEvent, "starts_at">[], now = Date.now()) {
  const starts = events
    .flatMap((event) => event.starts_at ? [new Date(event.starts_at).getTime()] : [])
    .filter(Number.isFinite);
  if (!starts.length) return "undated" as const;
  if (now < Math.min(...starts)) return "upcoming" as const;
  if (now <= Math.max(...starts) + CELEBRATION_LIVE_WINDOW_MS) return "live" as const;
  return "past" as const;
}
