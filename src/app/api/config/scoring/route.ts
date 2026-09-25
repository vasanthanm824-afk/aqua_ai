import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";

export async function GET() {
  try {
    const config = await prisma.vulnerabilityConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({
      success: true,
      config: config || {
        version: 1,
        name: "Standard Global Policy v1",
        ...DEFAULT_SCORING_WEIGHTS,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canConfigureScoring")) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator privileges required to modify scoring policy." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      populationWeight = 0.10,
      waterWeight,
      sanitationWeight,
      socioeconomicWeight,
      climateWeight,
      infrastructureWeight,
      minCompletenessThreshold = 50.0,
    } = body;

    const popW = parseFloat(populationWeight);
    const watW = parseFloat(waterWeight);
    const sanW = parseFloat(sanitationWeight);
    const socW = parseFloat(socioeconomicWeight);
    const cliW = parseFloat(climateWeight);
    const infW = parseFloat(infrastructureWeight);

    const wSum = popW + watW + sanW + socW + cliW + infW;

    if (Math.abs(wSum - 1.0) > 0.01) {
      return NextResponse.json(
        { error: `Weights must sum to 100% (1.00). Current sum: ${(wSum * 100).toFixed(1)}%` },
        { status: 400 }
      );
    }

    // Deactivate previous active configs
    await prisma.vulnerabilityConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const latest = await prisma.vulnerabilityConfiguration.findFirst({
      orderBy: { version: "desc" },
    });
    const nextVersion = (latest?.version || 0) + 1;

    const newConfig = await prisma.vulnerabilityConfiguration.create({
      data: {
        version: nextVersion,
        name: name || `AQUA-LENS India Policy v${nextVersion}`,
        isActive: true,
        populationWeight: popW,
        waterWeight: watW,
        sanitationWeight: sanW,
        socioeconomicWeight: socW,
        climateWeight: cliW,
        infrastructureWeight: infW,
        minCompletenessThreshold: parseFloat(minCompletenessThreshold),
        createdByUserId: session.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UPDATE",
        entityType: "VulnerabilityConfiguration",
        entityId: newConfig.id,
        detailsJson: JSON.stringify({ version: nextVersion, name: newConfig.name }),
      },
    });

    return NextResponse.json({ success: true, config: newConfig }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
