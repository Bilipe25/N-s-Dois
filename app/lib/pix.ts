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

function isValidCpf(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i), 10) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9), 10)) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i), 10) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10), 10)) return false;
    return true;
}

export function formatPixKey(key: string): string {
    const clean = key.replace(/\s+/g, '').trim();

    if (clean.includes('@')) {
        return clean;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(clean)) {
        return clean;
    }

    const digitsAndPlus = clean.replace(/[^0-9+]/g, '');

    if (digitsAndPlus.startsWith('+55')) {
        return digitsAndPlus;
    }

    if (digitsAndPlus.startsWith('55') && digitsAndPlus.length === 13) {
        return `+${digitsAndPlus}`;
    }

    const digitsOnly = digitsAndPlus.replace(/\D/g, '');

    if (digitsOnly.length === 14) {
        return digitsOnly;
    }

    if (digitsOnly.length === 11) {
        if (isValidCpf(digitsOnly)) {
            return digitsOnly;
        }

        const ddd = parseInt(digitsOnly.substring(0, 2), 10);
        const isDdd = ddd >= 11 && ddd <= 99;
        const isMobile = digitsOnly.charAt(2) === '9';

        if (isDdd && isMobile) {
            return `+55${digitsOnly}`;
        }
    }

    return digitsOnly;
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

    const formattedKey = formatPixKey(pixKey);
    const sanitizedName = sanitizeForPix(recipientName, 25);
    const sanitizedCity = sanitizeForPix(city, 15);

    // Merchant Account Information (ID 26)
    const gui = pad('00', 'br.gov.bcb.pix');
    const key = pad('01', formattedKey);
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
