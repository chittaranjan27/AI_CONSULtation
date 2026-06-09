import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

// DELETE /api/tenant/invitations/[id] - Revoke a pending invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, tenantId, id: currentUserId } = session.user;
    if (role !== "TENANT_OWNER" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation || invitation.tenantId !== tenantId) {
      return NextResponse.json({ error: "Invitation not found in this workspace" }, { status: 404 });
    }

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        action: "team.invitation.revoke",
        entity: "invitation",
        entityId: id,
        metadata: {
          revokedEmail: invitation.email,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Invitation revoked successfully" });
  } catch (error) {
    console.error("Error revoking invitation:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
