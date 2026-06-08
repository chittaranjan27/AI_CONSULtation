const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting dummy data cleanup...");

  // Delete all System Notifications
  console.log("Deleting system notifications...");
  await prisma.systemNotification.deleteMany({});

  // Delete all tenants except the system-admin-tenant
  // Deleting a Tenant cascades and deletes its Users, Chatbots, Conversations, Messages,
  // Leads, UsageRecords, DailyStats, Integrations, AuditLogs, Products, etc.
  console.log("Deleting mock tenants (and all cascaded chatbot, lead, conversation, and log data)...");
  const deleteResult = await prisma.tenant.deleteMany({
    where: {
      slug: {
        not: "system-admin-tenant"
      }
    }
  });

  console.log(`Successfully removed ${deleteResult.count} mock tenant environments.`);
  console.log("Database cleared! Maintained: Super Admin user, Operations tenant, and SaaS plans.");
}

main()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
