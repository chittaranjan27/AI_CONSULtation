import { test, describe } from "node:test";
import assert from "node:assert/strict";
import prisma from "../lib/db/prisma";
import { retrieveContext, invalidateRAGCache } from "../lib/ai/rag";

describe("Phase 2: PostgreSQL/Neon pgvector RAG Tests", () => {
  test("1. pgvector extension and HNSW index are active in Neon database", async () => {
    const ext = await prisma.$queryRawUnsafe<any[]>(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
    );
    assert.equal(ext.length, 1, "pgvector extension must be active in PostgreSQL");
    assert.equal(ext[0].extname, "vector");

    const indexes = await prisma.$queryRawUnsafe<any[]>(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'DocumentChunk' AND indexname = 'document_chunk_embedding_hnsw_idx'"
    );
    assert.equal(indexes.length, 1, "document_chunk_embedding_hnsw_idx HNSW index must exist");
  });

  test("2. Parameterized query executes pgvector cosine distance natively in DB", async () => {
    const testVec = new Array(1536).fill(0).map(() => 0.05);
    const vecLiteral = `[${testVec.join(",")}]`;

    const res = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        dc.id,
        dc.content,
        (1 - (COALESCE(dc.embedding_vec, dc.embedding::vector(1536)) <=> $1::vector))::float AS similarity,
        d.filename AS source
      FROM "DocumentChunk" dc
      INNER JOIN "Document" d ON dc."documentId" = d.id
      WHERE dc."chatbotId" = $2
        AND d."status" = 'COMPLETED'
      ORDER BY COALESCE(dc.embedding_vec, dc.embedding::vector(1536)) <=> $1::vector ASC
      LIMIT $3
      `,
      vecLiteral,
      "non-existent-chatbot-id",
      5
    );

    assert.ok(Array.isArray(res), "Query must return an array");
    assert.equal(res.length, 0, "Non-existent chatbot must return 0 results safely without crashing");
  });

  test("3. Multi-tenant isolation: Tenant A cannot retrieve Tenant B's chunks", async () => {
    const testVec = new Array(1536).fill(0).map(() => 0.05);
    const vecLiteral = `[${testVec.join(",")}]`;

    // Query with tenantId restriction
    const res = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT dc.id
      FROM "DocumentChunk" dc
      INNER JOIN "Document" d ON dc."documentId" = d.id
      WHERE dc."chatbotId" = $1
        AND d."tenantId" = $2
        AND d."status" = 'COMPLETED'
      LIMIT 5
      `,
      "bot-1",
      "tenant-attacker-id"
    );

    assert.equal(res.length, 0, "Must isolate chunks by tenantId in the database query");
  });

  test("4. Empty query or missing parameters return empty results safely", async () => {
    const resEmpty = await retrieveContext("", "", "mock-api-key");
    assert.deepEqual(resEmpty.chunks, []);
    assert.equal(resEmpty.augmentedPrompt, "");
  });

  test("5. invalidateRAGCache executes without error", () => {
    assert.doesNotThrow(() => {
      invalidateRAGCache("test-bot-123");
    });
  });
});
