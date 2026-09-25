import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/db-auto-seed";

export async function GET(request: Request) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const communityId = searchParams.get("communityId");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (communityId) where.communityId = communityId;

    const interventions = await prisma.intervention.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        community: {
          select: {
            id: true,
            name: true,
            code: true,
            state: true,
            district: true,
            block: true,
            compositeVulnerabilityScore: true,
            vulnerabilityCategory: true,
          },
        },
        assignedOfficer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: interventions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canCreateInterventions")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      communityId,
      title,
      issueCategory = "WATER_SUPPLY",
      recommendedAction,
      priority = "MEDIUM",
      proposedStartDate,
      proposedEndDate,
      assignedOrg,
      assignedOfficerId,
      estimatedBudget = 0,
      fundingSource = "Municipal Fund",
      comments,
    } = body;

    if (!communityId || !title || !recommendedAction) {
      return NextResponse.json(
        { error: "Community ID, Title, and Action are required" },
        { status: 400 }
      );
    }

    const intervention = await prisma.intervention.create({
      data: {
        communityId,
        title,
        issueCategory,
        recommendedAction,
        priority,
        status: "IDENTIFIED",
        proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
        proposedEndDate: proposedEndDate ? new Date(proposedEndDate) : null,
        assignedOrg: assignedOrg || "Global Water Resilience Alliance",
        assignedOfficerId: assignedOfficerId || null,
        estimatedBudget: parseFloat(estimatedBudget) || 0,
        fundingSource,
        comments,
        auditLogJson: JSON.stringify([
          {
            action: "CREATED",
            user: session.name,
            timestamp: new Date().toISOString(),
          },
        ]),
      },
      include: {
        community: true,
        assignedOfficer: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "CREATE",
        entityType: "Intervention",
        entityId: intervention.id,
        detailsJson: JSON.stringify({ title: intervention.title, priority: intervention.priority }),
      },
    });

    return NextResponse.json({ success: true, data: intervention }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
