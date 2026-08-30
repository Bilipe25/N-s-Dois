type PixPayloadInput = {
  key: string;
  recipientName: string;
  city: string;
  amountCents?: number | null;
  transactionId?: string;
};

export interface PixPayloadOptions {
  pixKey: string;
  recipientName: string;
  city: string;
  amount?: number;
  txId?: string;
}

function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function sanitizePixText(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, maxLength)
    .trim();
}

export function formatPixKey(value: string) {
  const compact = value.replace(/\s+/g, "").trim();
  if (compact.includes("@")) return compact;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(compact)) {
    return compact;
  }
  const phoneOrDocument = compact.replace(/[^0-9+]/g, "");
  if (phoneOrDocument.startsWith("+55")) return phoneOrDocument;
  if (phoneOrDocument.startsWith("55") && phoneOrDocument.length === 13) return `+${phoneOrDocument}`;
  return phoneOrDocument.replace(/\D/g, "");
}

export function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function createPixPayload(input: PixPayloadInput) {
  const key = formatPixKey(input.key);
  if (!key || key.length > 77 || /[^\x20-\x7E]/.test(key)) throw new Error("Chave PIX inválida.");

  const merchantAccount = field("00", "BR.GOV.BCB.PIX") + field("01", key);
  const txid = sanitizePixText(input.transactionId || "***", 25) || "***";

  const payload = [
    field("00", "01"),
    field("26", merchantAccount),
    field("52", "0000"),
    field("53", "986"),
    input.amountCents ? field("54", (input.amountCents / 100).toFixed(2)) : "",
    field("58", "BR"),
    field("59", sanitizePixText(input.recipientName, 25) || "NAO INFORMADO"),
    field("60", sanitizePixText(input.city, 15) || "FORTALEZA"),
    field("62", field("05", txid)),
    "6304",
  ].join("");

  return `${payload}${crc16Ccitt(payload)}`;
}

export function generatePixPayload(options: PixPayloadOptions) {
  return createPixPayload({
    key: options.pixKey,
    recipientName: options.recipientName,
    city: options.city,
    amountCents: options.amount && options.amount > 0 ? Math.round(options.amount * 100) : null,
    transactionId: options.txId,
  });
}

export function extractPriceFromRange(priceRange: string | null | undefined) {
  if (!priceRange) return undefined;
  const numbers = priceRange.match(/\d+/g);
  if (!numbers?.length) return undefined;
  if (numbers.length === 1) return Number.parseInt(numbers[0], 10);
  const minimum = Number.parseInt(numbers[0], 10);
  const maximum = Number.parseInt(numbers[numbers.length - 1], 10);
  return Math.round((minimum + maximum) / 2);
}
