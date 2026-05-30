const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all documents...");
  try {
    const docs = await prisma.document.findMany({
      select: {
        id: true,
        filename: true,
        fileType: true,
        fileSize: true,
        status: true,
        chunkCount: true,
        chatbotId: true,
      }
    });
    console.log("Documents in DB:", docs);

    const chunkCount = await prisma.documentChunk.count();
    console.log("Total DocumentChunks in DB:", chunkCount);
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
