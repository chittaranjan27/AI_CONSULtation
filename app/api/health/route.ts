import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { checkRedisHealth } from "@/lib/redis/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    process: "ok";
    database: {
      status: "connected" | "unreachable";
      latencyMs?: number;
    };
    redis: {
      status: "connected" | "unreachable" | "disabled";
      latencyMs?: number;
    };
  };
}

/**
 * Production-ready Health Check Endpoint
 * Supports:
 * - GET /api/health -> Full readiness probe (PostgreSQL + Redis + App)
 * - GET /api/health?check=liveness -> Fast probe for container restart policy
 * - GET /api/health?check=readiness -> Explicit readiness probe for load balancers
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkType = searchParams.get("check");

  // 1. Fast Liveness Probe (process is alive and running)
  if (checkType === "liveness") {
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
    );
  }

  // 2. Comprehensive Readiness Probe
  const startTime = Date.now();
  let dbHealthy = false;
  let dbLatencyMs = 0;

  // A. Database Connectivity Check (SELECT 1 with 2000ms timeout)
  try {
    const dbStart = Date.now();
    const dbPromise = prisma.$queryRawUnsafe("SELECT 1");
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    await Promise.race([dbPromise, timeoutPromise]);
    dbLatencyMs = Date.now() - dbStart;
    dbHealthy = true;
  } catch {
    dbHealthy = false;
    dbLatencyMs = Date.now() - startTime;
  }

  // B. Redis Connectivity Check (optional dependency)
  const redisResult = await checkRedisHealth(1500);
  const hasRedisConfigured = Boolean(process.env.REDIS_URL?.trim());

  const redisStatus: "connected" | "unreachable" | "disabled" = !hasRedisConfigured
    ? "disabled"
    : redisResult.healthy
    ? "connected"
    : "unreachable";

  // Critical dependency rule:
  // - PostgreSQL is essential for serving traffic. If DB is down -> 503 Service Unavailable.
  // - Redis is a shared cache layer. If Redis is down, app can operate in degraded mode -> 200 (degraded).
  const isHealthy = dbHealthy;
  const overallStatus: "healthy" | "degraded" | "unhealthy" = !dbHealthy
    ? "unhealthy"
    : redisStatus === "unreachable"
    ? "degraded"
    : "healthy";

  const responseBody: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      process: "ok",
      database: {
        status: dbHealthy ? "connected" : "unreachable",
        latencyMs: dbLatencyMs,
      },
      redis: {
        status: redisStatus,
        ...(hasRedisConfigured ? { latencyMs: redisResult.latencyMs } : {}),
      },
    },
  };

  return NextResponse.json(responseBody, {
    status: isHealthy ? 200 : 503,
    headers: NO_CACHE_HEADERS,
  });
}
