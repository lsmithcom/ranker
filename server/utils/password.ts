import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function hashUserPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

export function validatePasswordStrength(password: string): boolean {
  return typeof password === 'string' && password.length >= 8
}
