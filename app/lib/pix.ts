/**
 * Gerador de payload PIX (BR Code / EMV) conforme especificação do Banco Central.
 * Implementa CRC16-CCITT-FALSE para validação.
 */

function pad(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
}

function crc16ccitt(str: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
        crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

function sanitizeForPix(str: string, maxLen: number): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-zA-Z0-9 ]/g, '') // keep only alphanumeric + space
        .replace(/\s+/g, ' ') // replace multiple spaces with single space
        .trim()
        .substring(0, maxLen)
        .trim() // trim again in case substring cut off on a space
        .toUpperCase();
}

export interface PixPayloadOptions {
    /** PIX key (CPF, email, phone, or random key) */
    pixKey: string;
    /** Recipient name (max 25 chars, auto-sanitized) */
    recipientName: string;
    /** City name (max 15 chars, auto-sanitized) */
    city: string;
    /** Optional amount in BRL (e.g., 250.00) */
    amount?: number;
    /** Optional transaction ID (max 25 chars, defaults to '***') */
    txId?: string;
}

/**
 * Generates a valid PIX BR Code (EMV) payload string.
 * This string can be used to generate a QR Code that banking apps will recognize,
 * or copied as "Pix Copia e Cola".
 */
export function generatePixPayload(options: PixPayloadOptions): string {
    const { pixKey, recipientName, city, amount, txId = '***' } = options;

    const sanitizedName = sanitizeForPix(recipientName, 25);
    const sanitizedCity = sanitizeForPix(city, 15);

    // Merchant Account Information (ID 26)
    const gui = pad('00', 'br.gov.bcb.pix');
    const key = pad('01', pixKey);
    const merchantAccountInfo = pad('26', gui + key);

    // Build payload without CRC
    let payload = '';
    payload += pad('00', '01');              // Payload Format Indicator
    payload += merchantAccountInfo;           // Merchant Account Info
    payload += pad('52', '0000');             // Merchant Category Code
    payload += pad('53', '986');              // Transaction Currency (BRL)

    if (amount && amount > 0) {
        payload += pad('54', amount.toFixed(2)); // Transaction Amount
    }

    payload += pad('58', 'BR');               // Country Code
    payload += pad('59', sanitizedName);      // Merchant Name
    payload += pad('60', sanitizedCity);       // Merchant City

    // Additional Data Field (ID 62)
    const additionalData = pad('05', txId);
    payload += pad('62', additionalData);

    // CRC placeholder (ID 63, length 04)
    payload += '6304';

    // Calculate CRC16
    const crc = crc16ccitt(payload);
    payload += crc;

    return payload;
}

/**
 * Extracts a numeric value from a price range string.
 * Examples:
 *   "R$ 150 a R$ 400" → 275 (average)
 *   "Até R$ 50" → 50
 *   "Acima de R$ 1000" → 1000
 *   "R$ 200" → 200
 */
export function extractPriceFromRange(priceRange: string | null | undefined): number | undefined {
    if (!priceRange) return undefined;

    const numbers = priceRange.match(/\d+/g);
    if (!numbers || numbers.length === 0) return undefined;

    if (numbers.length === 1) {
        return parseInt(numbers[0], 10);
    }

    // Two numbers: return the average (rounded)
    const min = parseInt(numbers[0], 10);
    const max = parseInt(numbers[numbers.length - 1], 10);
    return Math.round((min + max) / 2);
}
