import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Node falls back to IPv4 when Windows cannot reach Neon's IPv6 addresses.
function getWindowsNeonAdapter() {
  const databaseUrl = process.env.DATABASE_URL;
  if (
    process.platform !== "win32" ||
    process.env.NODE_ENV !== "development" ||
    !databaseUrl ||
    !URL.canParse(databaseUrl)
  ) {
    return null;
  }

  const url = new URL(databaseUrl);
  if (
    !url.hostname.endsWith(".neon.tech") ||
    !["postgres:", "postgresql:"].includes(url.protocol)
  ) {
    return null;
  }

  if (url.searchParams.get("sslmode") === "require") {
    url.searchParams.set("sslmode", "verify-full");
  }

  const connectionLimit = url.searchParams.get("connection_limit");
  const connectTimeout = url.searchParams.get("connect_timeout") ?? "5";

  return new PrismaPg(
    {
      connectionString: url.href,
      max: connectionLimit ? Number(connectionLimit) : undefined,
      connectionTimeoutMillis: Number(connectTimeout) * 1000,
    },
    { schema: url.searchParams.get("schema") ?? undefined },
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: getWindowsNeonAdapter(),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
