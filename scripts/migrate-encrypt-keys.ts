/**
 * Migration Script: Encrypt Existing Plaintext Tenant API Keys at Rest
 *
 * Guarantees:
 * 1. Resumable & Idempotent: Only migrates records where encryptedKey does NOT start with `enc:v1:`.
 * 2. Non-Destructive: Verifies decryption in-memory before updating the database.
 * 3. Zero Secret Leaks: Never prints plaintext keys or encryption secrets to logs/console.
 * 4. Preserves all tenant associations, providers, and timestamps.
 *
 * Usage:
 *   npx tsx scripts/migrate-encrypt-keys.ts
 *   npx tsx scripts/migrate-encrypt-keys.ts --verify-only
 */

import { PrismaClient } from "@prisma/client";
import { encryptApiKey, decryptApiKey, ENCRYPTION_VERSION_PREFIX } from "../lib/security/encryption";

const prisma = new PrismaClient();

async function main() {
  const isVerifyOnly = process.argv.includes("--verify-only");

  console.log("==================================================");
  console.log("🔒 Brahma Graha - Tenant API Key Migration");
  console.log(`Mode: ${isVerifyOnly ? "VERIFY ONLY" : "MIGRATION & VERIFICATION"}`);
  console.log("==================================================");

  try {
    const allKeys = await prisma.tenantApiKey.findMany({
      select: {
        id: true,
        tenantId: true,
        provider: true,
        encryptedKey: true,
        createdAt: true,
      },
    });

    console.log(`📊 Total TenantApiKey records found: ${allKeys.length}`);

    const plaintextRecords = allKeys.filter(
      (k) => !k.encryptedKey.startsWith(ENCRYPTION_VERSION_PREFIX)
    );
    const encryptedRecords = allKeys.filter((k) =>
      k.encryptedKey.startsWith(ENCRYPTION_VERSION_PREFIX)
    );

    console.log(`✅ Already Encrypted: ${encryptedRecords.length}`);
    console.log(`⚠️ Legacy Plaintext: ${plaintextRecords.length}`);

    if (isVerifyOnly) {
      console.log("\n🔍 Running verification on all encrypted records...");
      let verifySuccess = 0;
      let verifyFail = 0;

      for (const record of encryptedRecords) {
        try {
          const decrypted = decryptApiKey(record.encryptedKey);
          if (decrypted && decrypted.length > 0) {
            verifySuccess++;
          } else {
            console.error(`❌ Verification failed for key ID ${record.id} (empty decrypted output)`);
            verifyFail++;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`❌ Decryption error for key ID ${record.id}: ${msg}`);
          verifyFail++;
        }
      }

      console.log(`\nVerification Results: ${verifySuccess} valid, ${verifyFail} failed.`);
      if (verifyFail > 0 || plaintextRecords.length > 0) {
        process.exit(1);
      }
      return;
    }

    if (plaintextRecords.length === 0) {
      console.log("\n🎉 All tenant API keys are already encrypted at rest. Nothing to migrate.");
      return;
    }

    console.log(`\n⏳ Migrating ${plaintextRecords.length} legacy plaintext key(s)...`);

    let migratedCount = 0;
    let failedCount = 0;

    for (const record of plaintextRecords) {
      try {
        const rawPlaintext = record.encryptedKey;
        const encryptedValue = encryptApiKey(rawPlaintext);

        // Pre-write verification: Ensure ciphertext decodes exactly back to original plaintext
        const testDecrypted = decryptApiKey(encryptedValue);
        if (testDecrypted !== rawPlaintext) {
          throw new Error("Pre-commit decryption verification mismatch!");
        }

        // Commit update safely in a transaction per record
        await prisma.tenantApiKey.update({
          where: { id: record.id },
          data: {
            encryptedKey: encryptedValue,
          },
        });

        migratedCount++;
        console.log(`  ✓ Successfully encrypted key for Tenant: ${record.tenantId}, Provider: ${record.provider}`);
      } catch (err: unknown) {
        failedCount++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ Failed to migrate key ID ${record.id} (${record.provider}): ${msg}`);
      }
    }

    console.log("\n==================================================");
    console.log(`✨ Migration finished:`);
    console.log(`  Migrated: ${migratedCount}`);
    console.log(`  Failed:   ${failedCount}`);
    console.log("==================================================");

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Migration fatal error:", e);
  process.exit(1);
});
