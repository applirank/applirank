/**
 * AES-256-GCM encryption for sensitive data at rest (OAuth tokens).
 *
 * Uses BETTER_AUTH_SECRET to derive a 256-bit key via SHA-256.
 * Each encryption produces a unique random IV (12 bytes) and auth tag (16 bytes).
 * Format: base64(iv + authTag + ciphertext)
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * Derive a 256-bit encryption key from the application secret.
 * Uses SHA-256 to produce a fixed-length key from the variable-length secret.
 */
function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest()
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing: IV (12B) + AuthTag (16B) + Ciphertext.
 */
export function encrypt(plaintext: string, secret: string): string {
  const key = deriveKey(secret)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // Pack: IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString('base64')
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext.
 * Expects format: base64(IV + AuthTag + Ciphertext).
 * Returns null if decryption fails (tampered data, wrong key).
 */
export function decrypt(encryptedBase64: string, secret: string): string | null {
  try {
    const key = deriveKey(secret)
    const combined = Buffer.from(encryptedBase64, 'base64')

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      return null
    }

    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])

    return decrypted.toString('utf-8')
  }
  catch {
    return null
  }
}
