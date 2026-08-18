import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGO = 'aes-256-gcm';

function keyFrom(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

/** AES-256-GCM: iv(12) | tag(16) | ciphertext */
export function encryptSecret(plaintext: string, secret: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, keyFrom(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}

export function decryptSecret(payload: Buffer, secret: string): string {
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const data = payload.subarray(28);
  const decipher = createDecipheriv(ALGO, keyFrom(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(sha256(a), 'hex');
  const bufB = Buffer.from(sha256(b), 'hex');
  return timingSafeEqual(bufA, bufB);
}

/** One-time recovery codes for the console owner. */
export function generateRecoveryCodes(count = 8): { codes: string[]; hashed: string[] } {
  const codes = Array.from({ length: count }, () =>
    randomBytes(5).toString('hex').replace(/(.{5})(.{5})/, '$1-$2').toUpperCase(),
  );
  return { codes, hashed: codes.map((c) => sha256(c)) };
}
