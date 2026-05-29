/**
 * Text chunking utility for RAG pipeline.
 * Splits text into overlapping chunks for embedding and retrieval.
 */

export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

/**
 * Approximate token count (rough: ~4 chars per token for English).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks with overlap.
 * @param text - The input text to chunk.
 * @param maxChunkSize - Maximum chunk size in estimated tokens (default: 500).
 * @param overlap - Overlap in estimated tokens between chunks (default: 50).
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 500,
  overlap: number = 50
): TextChunk[] {
  const maxChars = maxChunkSize * 4;
  const overlapChars = overlap * 4;

  // Clean and normalize whitespace
  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanedText) return [];

  // Try to split on paragraph boundaries first
  const paragraphs = cleanedText.split(/\n\n+/);
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    // If adding this paragraph exceeds limit, finalize current chunk
    if (currentChunk && (currentChunk.length + trimmedPara.length + 2) > maxChars) {
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunkIndex++,
        tokenCount: estimateTokens(currentChunk),
      });

      // Start next chunk with overlap from end of current
      if (overlapChars > 0 && currentChunk.length > overlapChars) {
        currentChunk = currentChunk.slice(-overlapChars) + "\n\n" + trimmedPara;
      } else {
        currentChunk = trimmedPara;
      }
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + trimmedPara : trimmedPara;
    }

    // If single paragraph is too large, split by sentences
    if (currentChunk.length > maxChars) {
      const sentences = currentChunk.match(/[^.!?]+[.!?]+/g) || [currentChunk];
      currentChunk = "";

      for (const sentence of sentences) {
        if (currentChunk && (currentChunk.length + sentence.length) > maxChars) {
          chunks.push({
            content: currentChunk.trim(),
            chunkIndex: chunkIndex++,
            tokenCount: estimateTokens(currentChunk),
          });

          if (overlapChars > 0 && currentChunk.length > overlapChars) {
            currentChunk = currentChunk.slice(-overlapChars) + sentence;
          } else {
            currentChunk = sentence;
          }
        } else {
          currentChunk += sentence;
        }
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex,
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return chunks;
}
