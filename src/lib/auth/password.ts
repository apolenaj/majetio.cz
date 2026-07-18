import { hash, compare } from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  return compare(plain, passwordHash);
}

/** Min 8 chars, at least one letter and one digit — no composition theater beyond that. */
export function isPasswordStrongEnough(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false;
  if (!/[A-Za-zÀ-ž]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
}
