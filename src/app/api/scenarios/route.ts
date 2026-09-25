import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasPermission } from "@/lib/auth";

export async function GET() {
  try {
    const scenarios = await prisma.planningScenario.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        allocations: {
          include: {
            community: {
              select: {
                id: true,
                name: true,
                district: true,
                population: true,
                compositeVulnerabilityScore: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: scenarios });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canRunSimulations")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      totalBudget = 1000000,
      allocations = [],
      assumptions = {},
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Scenario name is required" }, { status: 400 });
    }

    let allocatedBudget = 0;
    let estimatedReach = 0;

    for (const alloc of allocations) {
      allocatedBudget += alloc.allocatedAmount || (alloc.targetUnits * alloc.unitCost);
      estimatedReach += alloc.estimatedPopulationServed || 0;
    }

    const remainingBudget = Math.max(0, totalBudget - allocatedBudget);

    const scenario = await prisma.planningScenario.create({
      data: {
        name,
        description,
        totalBudget: parseFloat(totalBudget),
        allocatedBudget,
        remainingBudget,
        populationTarget: estimatedReach,
        estimatedReach,
        assumptionsJson: JSON.stringify(assumptions),
        createdByUserId: session.id,
        allocations: {
          create: allocations.map((a: any) => ({
            communityId: a.communityId,
            interventionType: a.interventionType,
            unitCost: parseFloat(a.unitCost),
            targetUnits: parseInt(a.targetUnits, 10),
            allocatedAmount: parseFloat(a.allocatedAmount || a.targetUnits * a.unitCost),
            estimatedPopulationServed: parseInt(a.estimatedPopulationServed || 0, 10),
          })),
        },
      },
      include: {
        allocations: {
          include: {
            community: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "SIMULATE",
        entityType: "PlanningScenario",
        entityId: scenario.id,
        detailsJson: JSON.stringify({ name: scenario.name, totalBudget, allocatedBudget }),
      },
    });

    return NextResponse.json({ success: true, data: scenario }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
