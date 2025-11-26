import crypto from 'crypto';

const RAW_KEY = process.env.ENCRYPTION_KEY || 'a_default_secret_key_of_32_bytes!';
// Ensure key is exactly 32 bytes for aes-256-cbc
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(RAW_KEY)).digest('base64').substr(0, 32);
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
