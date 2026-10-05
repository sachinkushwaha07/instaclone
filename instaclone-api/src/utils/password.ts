import bcrypt from 'bcryptjs';

// 12 rounds is a reasonable balance in 2026: high enough to make offline
// cracking of a stolen hash expensive, low enough not to make login feel slow.
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}