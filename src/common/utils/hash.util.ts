import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashValue(value: string): Promise<string> {
  return bcrypt.hash(value, SALT_ROUNDS);
}

export async function compareValue(
  plainValue: string,
  hashedValue: string,
): Promise<boolean> {
  return bcrypt.compare(plainValue, hashedValue);
}
