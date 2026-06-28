import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const OLD_SALT_PREFIX = "$2a$10$"; // bcrypt 10-round marker

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Returns true if the hash was produced with fewer than current SALT_ROUNDS and should be re-hashed. */
export function needsRehash(hash: string): boolean {
  return hash.startsWith(OLD_SALT_PREFIX) && SALT_ROUNDS > 10;
}
