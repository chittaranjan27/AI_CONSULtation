import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
  getEncryptionKey,
  _resetKeyCacheForTesting,
  ENCRYPTION_VERSION_PREFIX,
} from "../lib/security/encryption";

describe("Critical Issue A: AES-256-GCM Encryption Utility Tests", () => {
  const originalEnvKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    _resetKeyCacheForTesting();
  });

  test("1. Successfully encrypts and decrypts valid plaintext API key", () => {
    const rawKey = "sk-proj-test1234567890abcdefghijklmnopqrstuvwxyz";
    const encrypted = encryptApiKey(rawKey);

    assert.ok(encrypted.startsWith(ENCRYPTION_VERSION_PREFIX), "Must start with enc:v1: prefix");
    assert.notEqual(encrypted, rawKey, "Ciphertext must not match plaintext");

    const decrypted = decryptApiKey(encrypted);
    assert.equal(decrypted, rawKey, "Decrypted text must exactly match original plaintext");
  });

  test("2. Fresh, cryptographically distinct IV generated for each encryption", () => {
    const rawKey = "sk-proj-identical-key-test";
    const enc1 = encryptApiKey(rawKey);
    const enc2 = encryptApiKey(rawKey);

    assert.notEqual(enc1, enc2, "Identical plaintext must yield distinct ciphertexts due to fresh IV");

    const iv1 = enc1.split(":")[2];
    const iv2 = enc2.split(":")[2];
    assert.notEqual(iv1, iv2, "IVs must be distinct");
  });

  test("3. Rejects invalid encryption key lengths (fails closed)", () => {
    process.env.ENCRYPTION_KEY = "too-short-key";
    _resetKeyCacheForTesting();

    assert.throws(
      () => getEncryptionKey(),
      /ENCRYPTION_KEY is invalid/,
      "Must throw descriptive error when key is not 32 bytes"
    );
  });

  test("4. Rejects tampered ciphertext and modified authentication tags", () => {
    const rawKey = "sk-proj-secret-token";
    const encrypted = encryptApiKey(rawKey);

    // Tamper with the ciphertext component
    const parts = encrypted.slice(ENCRYPTION_VERSION_PREFIX.length).split(":");
    const tamperedCiphertext = `${ENCRYPTION_VERSION_PREFIX}${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}ff`;

    assert.throws(
      () => decryptApiKey(tamperedCiphertext),
      /Decryption failed|authentication tag/,
      "Must throw on tampered ciphertext"
    );

    // Tamper with authentication tag
    const tamperedTag = `${ENCRYPTION_VERSION_PREFIX}${parts[0]}:00000000000000000000000000000000:${parts[2]}`;
    assert.throws(
      () => decryptApiKey(tamperedTag),
      /Decryption failed|authentication tag/,
      "Must throw on tampered auth tag"
    );
  });

  test("5. Rejects decryption with an incorrect key", () => {
    const rawKey = "sk-proj-secret-token-key-rotation";
    const encrypted = encryptApiKey(rawKey);

    // Switch to another valid 32-byte key
    process.env.ENCRYPTION_KEY = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
    _resetKeyCacheForTesting();

    assert.throws(
      () => decryptApiKey(encrypted),
      /Decryption failed/,
      "Must reject decryption when attempted with wrong key"
    );
  });

  test("6. Never re-encrypts an already encrypted string (idempotent)", () => {
    const rawKey = "sk-proj-idempotency-check";
    const enc1 = encryptApiKey(rawKey);
    const enc2 = encryptApiKey(enc1);

    assert.equal(enc1, enc2, "Encrypting an already encrypted key must return the exact same string");
  });

  test("7. Backward compatibility: returns legacy plaintext without crashing", () => {
    const legacyPlaintext = "sk-proj-legacy-unencrypted-key-from-old-db";
    const result = decryptApiKey(legacyPlaintext);

    assert.equal(result, legacyPlaintext, "Legacy plaintext must pass through transparently");
  });

  test("8. Safely masks API keys for UI display without leaking secrets", () => {
    const rawKey = "sk-proj-1234567890abcdef4f8b";
    const maskedPlain = maskApiKey(rawKey);
    assert.equal(maskedPlain, "sk-proj-...4f8b");

    const encrypted = encryptApiKey(rawKey);
    const maskedEnc = maskApiKey(encrypted);
    assert.equal(maskedEnc, "sk-proj-...4f8b", "Masking encrypted key must decrypt and mask properly");
    assert.ok(!maskedEnc.includes("1234567890abcdef"), "Must not leak secret payload");
  });
});
