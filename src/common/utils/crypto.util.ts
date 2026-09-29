import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export function encryptText(text: string, secretKeyHex?: string): string {
  if (!text) return '';
  const keyHex =
    secretKeyHex ||
    process.env.ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  const key = Buffer.from(keyHex.slice(0, 64), 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptText(payload: string, secretKeyHex?: string): string {
  if (!payload || !payload.includes(':')) return payload;

  try {
    const parts = payload.split(':');
    if (parts.length !== 3) {
      return payload;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const keyHex =
      secretKeyHex ||
      process.env.ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const key = Buffer.from(keyHex.slice(0, 64), 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    return payload;
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '********';
  const prefix = apiKey.slice(0, 4);
  const suffix = apiKey.slice(-4);
  return `${prefix}...${suffix}`;
}
