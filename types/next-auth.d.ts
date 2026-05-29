import "next-auth";
import { UserRole, PlanType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: string;
      tenantId: string;
      tenantName: string;
      tenantSlug: string;
      tenantPlan: string;
    };
  }

  interface User {
    role?: UserRole;
    tenantId?: string;
    tenantName?: string;
    tenantSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    tenantPlan: string;
  }
}
