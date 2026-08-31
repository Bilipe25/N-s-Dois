const COMBINING_MARKS = /[\u0300-\u036f]/g;
const WHITESPACE = /\s+/g;

export function cleanGuestName(value: string) {
  return value.trim().replace(WHITESPACE, " ");
}

export function normalizeGuestName(value: string) {
  return cleanGuestName(value)
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLocaleLowerCase("pt-BR");
}

export function normalizeOptionalPhone(value?: string | null) {
  if (!value?.trim()) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}
