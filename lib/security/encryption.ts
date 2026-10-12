import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for AES-GCM
const PREFIX = "enc:v1:";

/**
 * Derives a deterministic 32-byte (256-bit) encryption key from the environment secret.
 * Falls back to NEXTAUTH_SECRET or a default internal key if ENCRYPTION_KEY is not set.
 */
function getDerivedKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "brahma-graha-secure-encryption-key-default-32";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 *
 * If already encrypted, returns as-is to prevent double-encryption.
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") return "";

  const trimmed = plaintext.trim();
  if (trimmed.startsWith(PREFIX)) {
    return trimmed;
  }

  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(trimmed, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string encrypted with AES-256-GCM.
 *
 * Backward-compatibility:
 * If the string does NOT start with `enc:v1:`, it is treated as legacy plaintext
 * and returned immediately without errors.
 */
export function decryptApiKey(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== "string") return "";

  const trimmed = ciphertext.trim();

  // Legacy plaintext backwards compatibility
  if (!trimmed.startsWith(PREFIX)) {
    return trimmed;
  }

  try {
    const parts = trimmed.slice(PREFIX.length).split(":");
    if (parts.length !== 3) {
      return trimmed;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getDerivedKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[SECURITY] Failed to decrypt API key:", error);
    // In case of wrong encryption key, return empty string to prevent crashing
    return "";
  }
}

/**
 * Masks an API key for safe UI display (e.g. "sk-proj-...4f8b").
 * Automatically decrypts the key first if encrypted.
 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  const plain = decryptApiKey(key);
  if (!plain) return "";
  if (plain.length <= 12) return "••••••••••••";
  return `${plain.slice(0, 8)}...${plain.slice(-4)}`;
}
