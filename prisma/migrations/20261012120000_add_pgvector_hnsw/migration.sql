-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding_vec vector(1536) column to DocumentChunk if not exists
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS "embedding_vec" vector(1536);

-- Backfill any existing embeddings
UPDATE "DocumentChunk"
SET "embedding_vec" = "embedding"::vector(1536)
WHERE "embedding_vec" IS NULL AND "embedding" IS NOT NULL AND array_length("embedding", 1) = 1536;

-- Create HNSW index for fast vector cosine similarity search
CREATE INDEX IF NOT EXISTS "document_chunk_embedding_hnsw_idx"
ON "DocumentChunk" USING hnsw ("embedding_vec" vector_cosine_ops);

-- Create compound index for fast tenant & chatbot chunk filtering
CREATE INDEX IF NOT EXISTS "document_chunk_chatbot_doc_idx"
ON "DocumentChunk" ("chatbotId", "documentId");

-- Automatic sync trigger: Keep embedding_vec in sync with embedding column
CREATE OR REPLACE FUNCTION sync_document_chunk_embedding_vec()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.embedding IS NOT NULL AND array_length(NEW.embedding, 1) = 1536 THEN
    NEW.embedding_vec := NEW.embedding::vector(1536);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_document_chunk_embedding_vec ON "DocumentChunk";
CREATE TRIGGER trg_sync_document_chunk_embedding_vec
BEFORE INSERT OR UPDATE ON "DocumentChunk"
FOR EACH ROW EXECUTE FUNCTION sync_document_chunk_embedding_vec();
