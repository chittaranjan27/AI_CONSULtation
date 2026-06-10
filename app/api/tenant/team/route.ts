import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

// GET /api/tenant/team - Fetch all active team members in the tenant
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, tenantId } = session.user;
    if (role !== "SUPER_ADMIN" && role !== "TENANT_OWNER" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const members = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching tenant team:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH /api/tenant/team - Update a team member's role or active status
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role: currentUserRole, tenantId, id: currentUserId } = session.user;
    if (currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "TENANT_OWNER" && currentUserRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Look up target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || targetUser.tenantId !== tenantId) {
      return NextResponse.json({ error: "User not found in this workspace" }, { status: 404 });
    }

    // Role hierarchies checks
    // 1. Cannot modify yourself
    if (targetUser.id === currentUserId) {
      return NextResponse.json({ error: "You cannot modify your own role or status" }, { status: 400 });
    }

    // 2. Managers cannot modify Owners
    if (targetUser.role === "TENANT_OWNER" && currentUserRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only Super Admins can modify the Site Owner" }, { status: 403 });
    }

    // 3. Managers cannot demote other Managers or promote to Owner
    if (currentUserRole === "MANAGER") {
      if (targetUser.role === "MANAGER") {
        return NextResponse.json({ error: "Managers cannot modify other Managers" }, { status: 403 });
      }
      if (role && (role === "TENANT_OWNER" || role === "SUPER_ADMIN")) {
        return NextResponse.json({ error: "Managers cannot assign Owner or Super Admin roles" }, { status: 403 });
      }
    }

    // Perform update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role !== undefined ? role : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        action: "team.member.update",
        entity: "user",
        entityId: updatedUser.id,
        metadata: {
          updatedUserEmail: updatedUser.email,
          changes: { role, isActive },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/tenant/team - Remove a member from the workspace
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role: currentUserRole, tenantId, id: currentUserId } = session.user;
    if (currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "TENANT_OWNER" && currentUserRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Look up target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || targetUser.tenantId !== tenantId) {
      return NextResponse.json({ error: "User not found in this workspace" }, { status: 404 });
    }

    // Role hierarchy checks
    // 1. Cannot delete yourself
    if (targetUser.id === currentUserId) {
      return NextResponse.json({ error: "You cannot delete your own account from here" }, { status: 400 });
    }

    // 2. Managers cannot delete Owners
    if (targetUser.role === "TENANT_OWNER" && currentUserRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only Super Admins can remove the Site Owner" }, { status: 403 });
    }

    // 3. Managers cannot delete other Managers
    if (currentUserRole === "MANAGER" && targetUser.role === "MANAGER") {
      return NextResponse.json({ error: "Managers cannot remove other Managers" }, { status: 403 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        action: "team.member.delete",
        entity: "user",
        entityId: userId,
        metadata: {
          deletedUserEmail: targetUser.email,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Team member removed" });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
