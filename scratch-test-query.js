const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = 'cmpjnrcfx0001f1a8psq8obcr';
  const tenantId = 'cmpha2an80000f1p4n3z0rxhx';

  console.log("Running findUnique...");
  try {
    const chatbot = await prisma.chatbot.findUnique({
      where: { id, tenantId }
    });
    console.log("findUnique result:", chatbot);
  } catch (err) {
    console.error("findUnique failed with error:", err.message);
  }

  console.log("\nRunning findFirst...");
  try {
    const chatbotFirst = await prisma.chatbot.findFirst({
      where: { id, tenantId }
    });
    console.log("findFirst result:", chatbotFirst);
  } catch (err) {
    console.error("findFirst failed with error:", err.message);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
