const { PrismaClient, PlanType, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB seeding...");

  // 1. Seed Pricing Plans
  console.log("Seeding Plans...");
  const plans = [
    {
      name: "Free",
      planType: PlanType.FREE,
      priceMonthly: 0,
      priceYearly: 0,
      chatbotLimit: 1,
      teamMemberLimit: 2,
      tokenLimit: 50000,
      leadLimit: 100,
      features: ["1 Chatbot", "100 Leads", "Limited Tokens"]
    },
    {
      name: "Starter",
      planType: PlanType.STARTER,
      priceMonthly: 29,
      priceYearly: 290,
      chatbotLimit: 5,
      teamMemberLimit: 5,
      tokenLimit: 250000,
      leadLimit: 1000,
      features: ["5 Chatbots", "1000 Leads", "Email Integration"]
    },
    {
      name: "Pro",
      planType: PlanType.PRO,
      priceMonthly: 79,
      priceYearly: 790,
      chatbotLimit: 25,
      teamMemberLimit: 15,
      tokenLimit: 1500000,
      leadLimit: 10000,
      features: ["Unlimited Chatbots", "Advanced Analytics", "Voice AI Consultation", "Dedicated Support"]
    },
    {
      name: "Enterprise",
      planType: PlanType.ENTERPRISE,
      priceMonthly: 299,
      priceYearly: 2990,
      chatbotLimit: 99999,
      teamMemberLimit: 99999,
      tokenLimit: 99999999,
      leadLimit: 999999,
      features: ["White Label", "Dedicated Support", "SLA Guarantee", "Custom AI Models"]
    }
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { planType: p.planType },
      update: p,
      create: p,
    });
  }
  console.log("Plans seeded successfully.");

  // 2. Create Admin Tenant & Super Admin User
  console.log("Creating Admin Tenant...");
  const adminTenantSlug = "system-admin-tenant";
  const adminTenant = await prisma.tenant.upsert({
    where: { slug: adminTenantSlug },
    update: {},
    create: {
      name: "System Operations",
      slug: adminTenantSlug,
      plan: PlanType.ENTERPRISE,
      settings: {
        defaultLanguage: "en",
        supportedLanguages: ["en"]
      }
    }
  });

  console.log("Creating Super Admin user...");
  const hashedPassword = await bcrypt.hash("AdminPassword123!", 12);
  const adminEmail = "admin@brahmagraha.com";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: adminEmail,
      name: "Platform Super Admin",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      tenantId: adminTenant.id,
      isActive: true,
    }
  });
  console.log(`Super Admin user ensured: ${adminEmail} (password: AdminPassword123!)`);

  // Ensure Admin Subscription exists
  await prisma.subscription.upsert({
    where: { tenantId: adminTenant.id },
    update: { plan: PlanType.ENTERPRISE, status: "ACTIVE" },
    create: {
      tenantId: adminTenant.id,
      plan: PlanType.ENTERPRISE,
      status: "ACTIVE"
    }
  });

  // 3. Create Additional Mock Tenants to populate dashboard
  console.log("Checking and seeding mock tenants...");
  const tenantConfigs = [
    { name: "Acme Medical Group", slug: "acme-med", plan: PlanType.PRO },
    { name: "Apex Lead Gen", slug: "apex-leads", plan: PlanType.STARTER },
    { name: "Vortex Beauty", slug: "vortex-beauty", plan: PlanType.FREE },
    { name: "Global Consulting Group", slug: "global-consult", plan: PlanType.ENTERPRISE }
  ];

  const seededTenants = [];
  for (const tc of tenantConfigs) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tc.slug },
      update: { plan: tc.plan },
      create: {
        name: tc.name,
        slug: tc.slug,
        plan: tc.plan,
        settings: {
          defaultLanguage: "en",
          supportedLanguages: ["en"]
        }
      }
    });
    seededTenants.push(tenant);

    // Create Tenant Admin
    const tAdminEmail = `admin@${tc.slug}.com`;
    const tHashedPassword = await bcrypt.hash("TenantAdmin123!", 12);
    await prisma.user.upsert({
      where: { email: tAdminEmail },
      update: {},
      create: {
        email: tAdminEmail,
        name: `${tc.name} Admin`,
        password: tHashedPassword,
        role: UserRole.TENANT_OWNER,
        tenantId: tenant.id,
        isActive: true,
      }
    });

    // Create Subscription
    await prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      update: { plan: tc.plan, status: "ACTIVE" },
      create: {
        tenantId: tenant.id,
        plan: tc.plan,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Create Chatbots
    const bot = await prisma.chatbot.create({
      data: {
        tenantId: tenant.id,
        name: `${tc.name} AI Agent`,
        description: `Conversational assistant for ${tc.name}`,
        systemPrompt: "You are a professional assistant.",
        status: "ACTIVE",
        aiProvider: "OPENAI",
        model: "gpt-4o-mini",
        supportedLanguages: ["en"]
      }
    });

    // Seed 10 mock leads
    for (let i = 0; i < 10; i++) {
      const isQualified = Math.random() > 0.4;
      await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          chatbotId: bot.id,
          name: `Lead Applicant ${i + 1}`,
          email: `lead${i + 1}@${tc.slug}-client.com`,
          phone: `+1 555-019${i}`,
          score: Math.floor(Math.random() * 40) + 60, // 60-100
          status: isQualified ? "QUALIFIED" : "NEW",
          source: "chatbot",
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 25) * 24 * 60 * 60 * 1000) // Random day in last 25 days
        }
      });
    }

    // Seed 15 mock conversations with messages
    for (let i = 0; i < 15; i++) {
      const conv = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          chatbotId: bot.id,
          status: "CLOSED",
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
          feedback: Math.random() > 0.6 ? "Excellent experience!" : null,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 25) * 24 * 60 * 60 * 1000)
        }
      });

      // Seed 2 messages (User + Assistant)
      const inputTokens = Math.floor(Math.random() * 100) + 50;
      const outputTokens = Math.floor(Math.random() * 200) + 100;
      // cost: input $0.15/1M, output $0.60/1M
      const cost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006);

      await prisma.message.create({
        data: {
          conversationId: conv.id,
          role: "USER",
          content: "Hello, I need help with pricing.",
          createdAt: conv.createdAt
        }
      });

      await prisma.message.create({
        data: {
          conversationId: conv.id,
          role: "ASSISTANT",
          content: "Sure, our pricing ranges from Free to Enterprise.",
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          cost,
          provider: "OPENAI",
          model: "gpt-4o-mini",
          createdAt: new Date(conv.createdAt.getTime() + 1500)
        }
      });

      // Create a UsageRecord
      await prisma.usageRecord.create({
        data: {
          tenantId: tenant.id,
          chatbotId: bot.id,
          conversationId: conv.id,
          provider: "OPENAI",
          model: "gpt-4o-mini",
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          cost,
          requestType: "LLM",
          createdAt: conv.createdAt
        }
      });

      // Seed Voice stats if PRO or ENTERPRISE
      if (tc.plan === PlanType.PRO || tc.plan === PlanType.ENTERPRISE) {
        // Audio Duration (seconds), Character Count
        const audioDuration = Math.random() * 30 + 10; // 10-40 seconds
        const characterCount = Math.floor(Math.random() * 100) + 50;
        const voiceCost = (audioDuration * (0.04 / 60)) + (characterCount * 0.00001); // mock prices

        await prisma.usageRecord.create({
          data: {
            tenantId: tenant.id,
            chatbotId: bot.id,
            conversationId: conv.id,
            provider: "SARVAM",
            model: "sarvam-voice",
            audioDuration,
            characterCount,
            cost: voiceCost,
            requestType: Math.random() > 0.5 ? "STT" : "TTS",
            createdAt: conv.createdAt
          }
        });
      }
    }
  }

  // 4. Seed CRM Integrations
  console.log("Seeding integrations...");
  for (const tenant of seededTenants) {
    const integrations = [
      { name: "HubSpot", type: "hubspot" },
      { name: "Zoho", type: "zoho" },
      { name: "Salesforce", type: "salesforce" },
      { name: "Google Sheets", type: "google_sheets" }
    ];

    for (const integ of integrations) {
      const isActive = Math.random() > 0.2;
      await prisma.integration.create({
        data: {
          tenantId: tenant.id,
          name: integ.name,
          type: integ.type,
          isActive,
          lastSyncAt: isActive ? new Date(Date.now() - Math.floor(Math.random() * 6) * 3600 * 1000) : null,
          config: {
            accessToken: "mock-token",
            syncInterval: "15m"
          }
        }
      });
    }
  }

  // 5. Seed DailyStats for last 30 days
  console.log("Seeding DailyStats...");
  for (const tenant of seededTenants) {
    const chatbots = await prisma.chatbot.findMany({ where: { tenantId: tenant.id } });
    const botId = chatbots[0]?.id;

    for (let day = 30; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);

      const conversations = Math.floor(Math.random() * 15) + 3;
      const messages = conversations * (Math.floor(Math.random() * 6) + 4);
      const leadsCaptured = Math.floor(conversations * (Math.random() * 0.4 + 0.1));
      const widgetOpens = conversations * (Math.floor(Math.random() * 2) + 2);
      const avgResponseTime = Math.random() * 1.5 + 0.5; // 0.5-2.0 seconds
      const avgDuration = Math.random() * 180 + 60; // 60-240 seconds

      const inputTokens = messages * 120;
      const outputTokens = messages * 180;
      const totalTokens = inputTokens + outputTokens;
      const chatCost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006);

      let voiceConversations = 0;
      let sttRequests = 0;
      let sttDuration = 0;
      let ttsRequests = 0;
      let ttsCharacters = 0;
      let voiceCost = 0;

      if (tenant.plan === PlanType.PRO || tenant.plan === PlanType.ENTERPRISE) {
        voiceConversations = Math.floor(conversations * 0.3);
        sttRequests = voiceConversations * 4;
        sttDuration = sttRequests * 15; // 15 seconds average
        ttsRequests = voiceConversations * 4;
        ttsCharacters = ttsRequests * 90;
        voiceCost = (sttDuration * (0.04 / 60)) + (ttsCharacters * 0.00001);
      }

      await prisma.dailyStats.create({
        data: {
          tenantId: tenant.id,
          chatbotId: botId,
          date,
          conversations,
          messages,
          leadsCaptured,
          widgetOpens,
          avgResponseTime,
          avgDuration,
          completionRate: Math.random() * 20 + 80, // 80-100%
          inputTokens,
          outputTokens,
          totalTokens,
          chatCost,
          voiceConversations,
          sttRequests,
          sttDuration,
          ttsRequests,
          ttsCharacters,
          voiceCost,
          totalCost: chatCost + voiceCost,
          newUsers: Math.floor(conversations * 0.8),
          returningUsers: Math.floor(conversations * 0.2)
        }
      });
    }
  }

  // 6. Seed AuditLogs
  console.log("Seeding AuditLogs...");
  for (const tenant of seededTenants) {
    const actions = [
      { action: "user.login", entity: "user" },
      { action: "chatbot.create", entity: "chatbot" },
      { action: "settings.update", entity: "tenant" },
      { action: "lead.export", entity: "lead" }
    ];

    for (let i = 0; i < 8; i++) {
      const act = actions[Math.floor(Math.random() * actions.length)];
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: act.action,
          entity: act.entity,
          entityId: "some-entity-id",
          metadata: { ip: "192.168.1.1", userAgent: "Mozilla/5.0" },
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // 7. Seed SystemNotifications (Admin alerts)
  console.log("Seeding SystemNotifications...");
  const notifications = [
    {
      type: "new_tenant",
      title: "New Tenant Registered",
      message: "Acme Medical Group created a new account on Plan: PRO.",
      metadata: { slug: "acme-med" }
    },
    {
      type: "tenant_suspended",
      title: "Tenant Suspended Due to Non-payment",
      message: "Apex Lead Gen's subscription payment failed 3 times. Account automatically suspended.",
      metadata: { slug: "apex-leads" }
    },
    {
      type: "token_limit_reached",
      title: "Tenant Reaching Token Limit",
      message: "Vortex Beauty has consumed 92% of their monthly token allocation.",
      metadata: { slug: "vortex-beauty", currentUsagePercent: 92 }
    },
    {
      type: "high_ai_costs",
      title: "Abnormal AI Usage Cost Spike",
      message: "Acme Medical Group's AI usage spiked by +240% in the last 6 hours.",
      metadata: { slug: "acme-med", spikeFactor: 2.4 }
    },
    {
      type: "crm_sync_failed",
      title: "CRM Integration Sync Failure",
      message: "Global Consulting Group's HubSpot integration failed to authenticate. Sync suspended.",
      metadata: { slug: "global-consult", provider: "hubspot" }
    },
    {
      type: "payment_failed",
      title: "Subscription Renewal Payment Failed",
      message: "Payment of $79.00 for Apex Lead Gen failed at gateway (Stripe card declined).",
      metadata: { slug: "apex-leads", amount: 79.0 }
    },
    {
      type: "system_error",
      title: "Platform AI Gateway Timeout",
      message: "Sarvam Voice Synthesis API returned 504 Gateway Timeout on 18 requests in the last hour.",
      metadata: { provider: "SARVAM", errorRate: "12%" }
    }
  ];

  for (const notif of notifications) {
    await prisma.systemNotification.create({
      data: {
        type: notif.type,
        title: notif.title,
        message: notif.message,
        metadata: notif.metadata,
        isRead: false
      }
    });
  }

  console.log("Database seeded successfully with premium analytics, templates, logs, and billing structures!");
}

main()
  .catch((e) => {
    console.error("Error seeding DB:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
