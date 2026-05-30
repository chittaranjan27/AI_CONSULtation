import prisma from "@/lib/db/prisma";
import { generateQueryEmbedding, cosineSimilarity } from "./embeddings";

interface RAGContext {
  chunks: { content: string; similarity: number; source: string }[];
  augmentedPrompt: string;
}

interface CachedChunk {
  content: string;
  embedding: number[];
  filename: string;
}

// Global cache variable to persist across hot reloads in development
const globalForRAGCache = globalThis as unknown as {
  ragCache: Map<string, { chunks: CachedChunk[]; timestamp: number }> | undefined;
};

export const ragCache = globalForRAGCache.ragCache ?? new Map<string, { chunks: CachedChunk[]; timestamp: number }>();
if (process.env.NODE_ENV !== "production") {
  globalForRAGCache.ragCache = ragCache;
}

/**
 * Invalidate RAG cache entry when documents are uploaded or modified.
 */
export function invalidateRAGCache(chatbotId: string) {
  ragCache.delete(chatbotId);
}

/**
 * RAG orchestrator: retrieve relevant knowledge base chunks for a chatbot query.
 *
 * @param chatbotId - The chatbot whose knowledge base to search.
 * @param query - The user's query.
 * @param embeddingApiKey - OpenAI API key for generating the query embedding.
 * @param topK - Number of top results to return.
 * @param minSimilarity - Minimum cosine similarity threshold.
 */
export async function retrieveContext(
  chatbotId: string,
  query: string,
  embeddingApiKey: string,
  topK: number = 5,
  minSimilarity: number = 0.3
): Promise<RAGContext> {
  let cachedData = ragCache.get(chatbotId);

  if (!cachedData) {
    // Fetch all chunks for this chatbot from database
    const allChunks = await prisma.documentChunk.findMany({
      where: { chatbotId },
      include: {
        document: {
          select: { filename: true },
        },
      },
    });

    const chunks = allChunks.map((chunk) => ({
      content: chunk.content,
      embedding: chunk.embedding,
      filename: chunk.document.filename,
    }));

    cachedData = { chunks, timestamp: Date.now() };
    ragCache.set(chatbotId, cachedData);
  }

  if (cachedData.chunks.length === 0) {
    return { chunks: [], augmentedPrompt: "" };
  }

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query, embeddingApiKey);

  // Calculate similarity scores using cached chunks
  const scored = cachedData.chunks
    .map((chunk) => ({
      content: chunk.content,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      source: chunk.filename,
    }))
    .filter((c) => c.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  // Build augmented context string
  const contextText = scored
    .map((c, i) => `[Source: ${c.source}]\n${c.content}`)
    .join("\n\n---\n\n");

  const augmentedPrompt = contextText
    ? `\n\n## Knowledge Base Context\nUse the following retrieved information to answer the user's question accurately. If the information doesn't contain the answer, say so honestly.\n\n${contextText}`
    : "";

  return { chunks: scored, augmentedPrompt };
}

