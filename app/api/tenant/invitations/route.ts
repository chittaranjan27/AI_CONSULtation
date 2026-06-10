import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

// GET /api/tenant/invitations - List all pending invitations for this tenant
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, tenantId } = session.user;
    if (role !== "TENANT_OWNER" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // Clear expired invitations automatically on access
    await prisma.invitation.deleteMany({
      where: {
        tenantId,
        expiresAt: { lt: new Date() },
      },
    });

    const invitations = await prisma.invitation.findMany({
      where: {
        tenantId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching tenant invitations:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/tenant/invitations - Create and send a new team invitation
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role: currentUserRole, tenantId, tenantName, id: currentUserId } = session.user;
    if (currentUserRole !== "TENANT_OWNER" && currentUserRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if the user is already registered on the platform
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email address is already registered on Brahma Graha" }, { status: 400 });
    }

    // Check if there is already an active pending invitation for this email in this tenant
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        tenantId,
        email: emailNormalized,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json({ error: "An active invitation has already been sent to this email address" }, { status: 400 });
    }

    // Look up the tenant plan to check limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Resolve plan limit (query from Plan database table, fallback to defaults if not found)
    const planLimits = await prisma.plan.findUnique({
      where: { planType: tenant.plan },
    });

    let teamMemberLimit = 5; // Default fallback for FREE/STARTER if plan records not seeded
    if (planLimits) {
      teamMemberLimit = planLimits.teamMemberLimit;
    } else {
      switch (tenant.plan) {
        case "FREE":
          teamMemberLimit = 2;
          break;
        case "STARTER":
          teamMemberLimit = 5;
          break;
        case "PRO":
          teamMemberLimit = 15;
          break;
        case "ENTERPRISE":
          teamMemberLimit = 9999;
          break;
      }
    }

    // Count active members + pending invitations in this tenant
    const activeMembersCount = await prisma.user.count({
      where: { tenantId },
    });

    const pendingInvitesCount = await prisma.invitation.count({
      where: {
        tenantId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (activeMembersCount + pendingInvitesCount >= teamMemberLimit) {
      return NextResponse.json({
        error: `Plan Limit Reached: Your current plan (${tenant.plan}) allows a maximum of ${teamMemberLimit} team members (active + pending). Please upgrade to invite more members.`
      }, { status: 400 });
    }

    // Generate secure registration token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    // Delete any old expired invitations for this email
    await prisma.invitation.deleteMany({
      where: {
        tenantId,
        email: emailNormalized,
      },
    });

    // Create invitation record
    const invitation = await prisma.invitation.create({
      data: {
        tenantId,
        email: emailNormalized,
        role,
        token,
        expiresAt,
        status: "PENDING",
      },
    });

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/accept?token=${token}`;

    const displayRole = role === "TENANT_OWNER" ? "Site Owner" : role.replace("_", " ");

    const mailText = `You have been invited to join the ${tenantName} workspace on Brahma Graha as a ${displayRole}.\n\nClick the link below to accept the invitation and set up your account:\n${inviteUrl}\n\nThis invitation link is valid for 7 days.`;
    const mailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; rounded: 8px;">
        <h2 style="color: #6b21a8; text-align: center;">Welcome to Brahma Graha</h2>
        <p>Hello,</p>
        <p>You have been invited to join the <strong>${tenantName}</strong> workspace on the Brahma Graha AI Consultation & Lead Conversion platform.</p>
        <p><strong>Role assigned:</strong> <span style="background-color: #f3e8ff; color: #6b21a8; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 13px;">${displayRole}</span></p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #6b21a8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This link will expire in 7 days. If you were not expecting this invitation, you can safely ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #999; font-size: 11px; text-align: center;">Brahma Graha AI Consultation SaaS</p>
      </div>
    `;

    await sendEmail({
      to: emailNormalized,
      subject: `Invitation to join ${tenantName} workspace on Brahma Graha`,
      text: mailText,
      html: mailHtml,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        action: "team.invitation.send",
        entity: "invitation",
        entityId: invitation.id,
        metadata: {
          invitedEmail: emailNormalized,
          invitedRole: role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating team invitation:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
