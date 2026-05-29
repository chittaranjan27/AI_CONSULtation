import prisma from "@/lib/db/prisma";
import { generateQueryEmbedding, cosineSimilarity } from "./embeddings";

interface RAGContext {
  chunks: { content: string; similarity: number; source: string }[];
  augmentedPrompt: string;
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
  // Check if chatbot has any document chunks
  const chunkCount = await prisma.documentChunk.count({
    where: { chatbotId },
  });

  if (chunkCount === 0) {
    return { chunks: [], augmentedPrompt: "" };
  }

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query, embeddingApiKey);

  // Fetch all chunks for this chatbot (for MVP, in-memory similarity)
  // For production, use pgvector extension with <=> operator
  const allChunks = await prisma.documentChunk.findMany({
    where: { chatbotId },
    include: {
      document: {
        select: { filename: true },
      },
    },
  });

  // Calculate similarity scores
  const scored = allChunks
    .map((chunk) => ({
      content: chunk.content,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      source: chunk.document.filename,
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
