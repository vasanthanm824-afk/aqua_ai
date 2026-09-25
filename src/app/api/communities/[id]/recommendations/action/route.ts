import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const community = await prisma.community.findUnique({
      where: { id },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const {
      title,
      reason,
      priority = "HIGH",
      estimatedCost = 2500000,
      suggestedAuthority = "TWAD Board & District Administration",
      category = "WATER_SUPPLY",
    } = body;

    if (!title || !reason) {
      return NextResponse.json({ error: "Title and reason are required" }, { status: 400 });
    }

    const session = await getSessionUser();

    // Create the intervention record in the central Intervention Planner
    const intervention = await prisma.intervention.create({
      data: {
        communityId: id,
        title,
        issueCategory: category,
        recommendedAction: reason,
        priority,
        status: "PLANNED",
        estimatedBudget: Number(estimatedCost),
        assignedOrg: suggestedAuthority,
        fundingSource: "Jal Jeevan Mission / SBM-G (Centrally Sponsored Scheme)",
        comments: `Created via Risk → Action Recommendation Engine for ${community.name}. Operational priority: ${priority}.`,
        auditLogJson: JSON.stringify([
          {
            action: "CREATED_FROM_RECOMMENDATION",
            user: session?.name || "System Risk Engine",
            timestamp: new Date().toISOString(),
          },
        ]),
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session?.id || "system",
        userName: session?.name || "System Risk Engine",
        action: "CREATE",
        entityType: "Intervention",
        entityId: intervention.id,
        detailsJson: JSON.stringify({
          communityId: id,
          communityName: community.name,
          title: intervention.title,
          priority: intervention.priority,
          budget: intervention.estimatedBudget,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully created planned action "${intervention.title}" in the Intervention Planner for ${community.name}.`,
      intervention,
    });
  } catch (error: any) {
    console.error("POST /api/communities/[id]/recommendations/action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
