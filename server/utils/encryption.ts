import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const config = useRuntimeConfig()
  const key = config.encryptionKey as string
  if (!key) throw new Error('ENCRYPTION_KEY is not set in environment variables')
  // Derive a consistent 32-byte key from the provided string
  return crypto.scryptSync(key, 'ranker-salt-v1', 32)
}

/**
 * Encrypts a plaintext string (for storing GSC tokens securely)
 * Returns: iv:authTag:encryptedData (all hex-encoded, colon-separated)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const key = getKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts a string encrypted with encrypt()
 */
export function decrypt(encryptedString: string): string {
  const parts = encryptedString.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format')
  }
  const [ivHex, authTagHex, encryptedText] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const key = getKey()

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
