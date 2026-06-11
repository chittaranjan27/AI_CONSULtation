import prisma from "@/lib/db/prisma";
import SystemOpsClient from "@/components/admin/SystemOpsClient";

export default async function AdminSystemOpsPage() {
  // Measure database latency
  let dbStatus = "HEALTHY";
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch (err) {
    console.error("Database health check failed:", err);
    dbStatus = "CRITICAL";
  }

  // Parallel database security aggregates & audit logs
  const [totalLogs, apiKeysCount, auditLogs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.tenantApiKey.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        tenant: { select: { name: true } },
      },
    }),
  ]);

  // Format audit logs to plain JSON-compatible objects
  const auditLogsJson = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
    tenant: log.tenant ? { name: log.tenant.name } : null,
  }));

  return (
    <SystemOpsClient
      dbStatus={dbStatus}
      dbLatency={dbLatency}
      totalLogs={totalLogs}
      apiKeysCount={apiKeysCount}
      auditLogs={auditLogsJson}
    />
  );
}
