import prisma from "@/lib/db/prisma";
import { generateQueryEmbedding } from "./embeddings";

// Ensure this utility is strictly server-only
if (typeof window !== "undefined") {
  throw new Error("Security alert: lib/ai/rag cannot be bundled or executed on the client.");
}

export interface RAGChunk {
  content: string;
  similarity: number;
  source: string;
}

export interface RAGContext {
  chunks: RAGChunk[];
  augmentedPrompt: string;
}

interface RawVectorQueryResult {
  id: string;
  content: string;
  similarity: number;
  source: string;
}

const EXPECTED_EMBEDDING_DIM = 1536;

/**
 * Backward compatibility: In pgvector mode, chunks are queried directly from PostgreSQL,
 * so in-memory cache invalidation is no longer required.
 */
export function invalidateRAGCache(chatbotId: string): void {
  // No-op: PostgreSQL pgvector queries are always real-time and strongly consistent.
}

/**
 * High-performance RAG retrieval utilizing PostgreSQL/Neon pgvector HNSW index.
 * Replaces application-side JavaScript cosine similarity with in-database vector search.
 *
 * @param chatbotId - The chatbot whose knowledge base to search.
 * @param query - The user query to embed and match.
 * @param embeddingApiKey - OpenAI API key used to generate query embedding.
 * @param topK - Maximum number of relevant chunks to retrieve (default: 5).
 * @param minSimilarity - Minimum cosine similarity threshold 0.0 - 1.0 (default: 0.3).
 * @param tenantId - Optional tenant ID to enforce strict multi-tenant boundary.
 */
export async function retrieveContext(
  chatbotId: string,
  query: string,
  embeddingApiKey: string,
  topK: number = 5,
  minSimilarity: number = 0.3,
  tenantId?: string
): Promise<RAGContext> {
  if (!chatbotId || !query || typeof query !== "string" || !query.trim()) {
    return { chunks: [], augmentedPrompt: "" };
  }

  const sanitizedTopK = Math.max(1, Math.min(topK, 20)); // Bounded between 1 and 20
  const sanitizedMinSim = Math.max(0.0, Math.min(minSimilarity, 1.0));

  // 1. Generate query embedding (1536-dimensional vector)
  const queryEmbedding = await generateQueryEmbedding(query.trim(), embeddingApiKey);

  // Validate embedding structure and dimensions
  if (
    !Array.isArray(queryEmbedding) ||
    queryEmbedding.length !== EXPECTED_EMBEDDING_DIM ||
    !queryEmbedding.every(Number.isFinite)
  ) {
    throw new Error(
      `[PGVECTOR ERROR] Query embedding dimension mismatch: expected ${EXPECTED_EMBEDDING_DIM} finite floats, got ${queryEmbedding?.length}.`
    );
  }

  // Format vector literal for PostgreSQL pgvector: '[0.0123,-0.0456,...]'
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  // 2. Execute parameterized in-database pgvector similarity search
  let rawChunks: RawVectorQueryResult[] = [];

  if (tenantId) {
    // Tenant-isolated vector search
    rawChunks = await prisma.$queryRawUnsafe<RawVectorQueryResult[]>(
      `
      SELECT 
        dc.id,
        dc.content,
        (1 - (COALESCE(dc.embedding_vec, dc.embedding::vector(1536)) <=> $1::vector))::float AS similarity,
        d.filename AS source
      FROM "DocumentChunk" dc
      INNER JOIN "Document" d ON dc."documentId" = d.id
      WHERE dc."chatbotId" = $2
        AND d."tenantId" = $3
        AND d."status" = 'COMPLETED'
        AND (1 - (COALESCE(dc.embedding_vec, dc.embedding::vector(1536)) <=> $1::vector)) >= $4
      ORDER BY COALESCE(dc.embedding_vec, dc.embedding::vector(1536)) <=> $1::vector ASC
      LIMIT $5
      `,
      vectorLiteral,
      chatbotId,
      tenantId,
      sanitizedMinSim,
      sanitizedTopK
    );
  } else {
    // Standard chatbot-scoped vector search
    rawChunks = await prisma.$queryRawUnsafe<RawVectorQueryResult[]>(
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
        AND (1 - (COALESCE(dc.embedding_vec, dc.embedding::vector(1536)) <=> $1::vector)) >= $3
      ORDER BY COALESCE(dc.embedding_vec, dc.embedding::vector(1536)) <=> $1::vector ASC
      LIMIT $4
      `,
      vectorLiteral,
      chatbotId,
      sanitizedMinSim,
      sanitizedTopK
    );
  }

  if (!rawChunks || rawChunks.length === 0) {
    return { chunks: [], augmentedPrompt: "" };
  }

  const scored: RAGChunk[] = rawChunks.map((chunk) => ({
    content: chunk.content,
    similarity: Math.round(chunk.similarity * 10000) / 10000,
    source: chunk.source || "knowledge_base",
  }));

  // Build augmented context prompt
  const contextText = scored
    .map((c) => `[Source: ${c.source} | Relevance: ${(c.similarity * 100).toFixed(1)}%]\n${c.content}`)
    .join("\n\n---\n\n");

  const augmentedPrompt = contextText
    ? `\n\n## Knowledge Base Context\nUse the following retrieved information to answer the user's question accurately. If the information doesn't contain the answer, say so honestly.\n\n${contextText}`
    : "";

  return { chunks: scored, augmentedPrompt };
}
