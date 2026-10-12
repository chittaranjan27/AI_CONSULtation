import crypto from "crypto";

// Ensure this utility is strictly server-only
if (typeof window !== "undefined") {
  throw new Error("Security alert: lib/security/encryption cannot be bundled or executed on the client.");
}

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits standard auth tag
const KEY_LENGTH_BYTES = 32; // 256 bits for AES-256
export const ENCRYPTION_VERSION_PREFIX = "enc:v1:";

let cachedKey: Buffer | null = null;

/**
 * Validates and retrieves the 32-byte (256-bit) encryption key from environment variables.
 * Supports:
 * - 64-character hex string (recommended: openssl rand -hex 32)
 * - 44-character base64 string (openssl rand -base64 32)
 * - Raw 32-character UTF-8 string
 */
export function getEncryptionKey(): Buffer {
  if (cachedKey) {
    return cachedKey;
  }

  const rawKey = process.env.ENCRYPTION_KEY?.trim();

  if (rawKey) {
    // 1. Try 64-char Hex encoding
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      const keyBuf = Buffer.from(rawKey, "hex");
      if (keyBuf.length === KEY_LENGTH_BYTES) {
        cachedKey = keyBuf;
        return cachedKey;
      }
    }

    // 2. Try Base64 encoding
    try {
      const b64Buf = Buffer.from(rawKey, "base64");
      if (b64Buf.length === KEY_LENGTH_BYTES) {
        cachedKey = b64Buf;
        return cachedKey;
      }
    } catch {
      // not base64
    }

    // 3. Raw 32-byte UTF-8 string
    const rawBuf = Buffer.from(rawKey, "utf8");
    if (rawBuf.length === KEY_LENGTH_BYTES) {
      cachedKey = rawBuf;
      return cachedKey;
    }

    // If key provided but invalid length
    throw new Error(
      `[SECURITY ERROR] ENCRYPTION_KEY is invalid. It must decode to exactly 32 bytes (64 hex characters or 44 base64 characters). Received ${rawKey.length} characters.`
    );
  }

  // Development / Test fallback
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[SECURITY FATAL] ENCRYPTION_KEY environment variable is missing in production. Generate a 32-byte key using `openssl rand -hex 32`."
    );
  }

  // In non-production, derive a fallback key from NEXTAUTH_SECRET with SHA-256
  const fallbackSecret = process.env.NEXTAUTH_SECRET || "brahma-graha-development-fallback-secret-2026";
  cachedKey = crypto.createHash("sha256").update(fallbackSecret).digest();
  return cachedKey;
}

/**
 * Resets cached key (used during testing key rotation).
 */
export function _resetKeyCacheForTesting(): void {
  cachedKey = null;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 *
 * Idempotent: If already encrypted (starts with `enc:v1:`), returns as-is to prevent double-encryption.
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") {
    return "";
  }

  const trimmed = plaintext.trim();
  if (trimmed.startsWith(ENCRYPTION_VERSION_PREFIX)) {
    return trimmed; // Already encrypted
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(trimmed, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_VERSION_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string encrypted with AES-256-GCM.
 *
 * Strict Security Guarantees:
 * 1. Verifies 12-byte IV and 16-byte Auth Tag.
 * 2. Authenticates ciphertext integrity with AES-GCM tag.
 * 3. Throws explicit error on tampered data or wrong key (fails closed).
 * 4. Backward Compatibility: If string does NOT have `enc:v1:` prefix,
 *    it is treated as legacy plaintext during transition.
 */
export function decryptApiKey(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== "string") {
    return "";
  }

  const trimmed = ciphertext.trim();

  // Legacy plaintext fallback for backwards compatibility
  if (!trimmed.startsWith(ENCRYPTION_VERSION_PREFIX)) {
    return trimmed;
  }

  const parts = trimmed.slice(ENCRYPTION_VERSION_PREFIX.length).split(":");
  if (parts.length !== 3) {
    throw new Error("[SECURITY ERROR] Invalid encrypted key format: payload must contain IV, authTag, and ciphertext.");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error(`[SECURITY ERROR] Invalid IV length: expected ${IV_LENGTH_BYTES} bytes, got ${iv.length} bytes.`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error(`[SECURITY ERROR] Invalid auth tag length: expected ${AUTH_TAG_LENGTH_BYTES} bytes, got ${authTag.length} bytes.`);
  }

  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err: unknown) {
    throw new Error(
      `[SECURITY ERROR] Decryption failed: authentication tag mismatch or invalid encryption key. Ensure ENCRYPTION_KEY is identical to the one used for encryption.`
    );
  }
}

/**
 * Safely masks an API key for UI display (e.g., "sk-proj-...4f8b").
 * Never leaks the secret value.
 */
export function maskApiKey(keyOrCiphertext: string): string {
  if (!keyOrCiphertext) return "";

  try {
    const plain = decryptApiKey(keyOrCiphertext);
    if (!plain) return "";
    if (plain.length <= 12) return "••••••••••••";
    return `${plain.slice(0, 8)}...${plain.slice(-4)}`;
  } catch {
    // If decryption fails (e.g. corrupted key), return generic masked placeholder
    return "••••••••••••";
  }
}
