const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING CHATBOT ===");
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: 'cmpjnrcfx0001f1a8psq8obcr' }
  });
  console.log("Chatbot data:", chatbot);

  console.log("\n=== CHECKING ALL CHATBOTS IN DB ===");
  const allBots = await prisma.chatbot.findMany({
    select: {
      id: true,
      name: true,
      tenantId: true
    }
  });
  console.log("All chatbots:", allBots);

  console.log("\n=== CHECKING USERS & TENANTS ===");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      tenantId: true
    }
  });
  console.log("Users:", users);

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true
    }
  });
  console.log("Tenants:", tenants);

  await prisma.$disconnect();
}

main().catch(console.error);
