import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateVulnerability, DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";
import { getSessionUser, hasPermission } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            contributions: true,
          },
        },
        interventions: {
          orderBy: { createdAt: "desc" },
          include: {
            assignedOfficer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        fieldVerifications: {
          orderBy: { verificationDate: "desc" },
        },
        infrastructureAssets: true,
        alerts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: community });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch community: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canUpdateInterventions")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.community.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const body = await request.json();

    // Prepare updated fields
    const updatedPopulation = body.population !== undefined ? parseInt(body.population) : existing.population;
    const updatedWater = body.waterAccessPct !== undefined ? parseFloat(body.waterAccessPct) : existing.waterAccessPct;
    const updatedSanitation = body.sanitationAccessPct !== undefined ? parseFloat(body.sanitationAccessPct) : existing.sanitationAccessPct;
    const updatedPoverty = body.povertyRate !== undefined ? parseFloat(body.povertyRate) : existing.povertyRate;
    const updatedFlood = body.floodHazardLevel !== undefined ? body.floodHazardLevel : existing.floodHazardLevel;
    const updatedRainfall = body.rainfallAnnualMm !== undefined ? parseFloat(body.rainfallAnnualMm) : existing.rainfallAnnualMm;
    const updatedInfra = body.infrastructureScore !== undefined ? parseFloat(body.infrastructureScore) : existing.infrastructureScore;

    // Recalculate vulnerability
    const config = await prisma.vulnerabilityConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });

    const weights = config
      ? {
          populationWeight: config.populationWeight ?? 0.10,
          waterWeight: config.waterWeight,
          sanitationWeight: config.sanitationWeight,
          socioeconomicWeight: config.socioeconomicWeight,
          climateWeight: config.climateWeight,
          infrastructureWeight: config.infrastructureWeight,
          minCompletenessThreshold: config.minCompletenessThreshold,
        }
      : DEFAULT_SCORING_WEIGHTS;

    const assessment = calculateVulnerability(
      {
        population: updatedPopulation,
        waterAccessPct: updatedWater,
        sanitationAccessPct: updatedSanitation,
        povertyRate: updatedPoverty,
        floodHazardLevel: updatedFlood,
        rainfallAnnualMm: updatedRainfall,
        infrastructureScore: updatedInfra,
      },
      weights
    );

    const community = await prisma.community.update({
      where: { id },
      data: {
        ...body,
        population: updatedPopulation,
        waterAccessPct: updatedWater,
        sanitationAccessPct: updatedSanitation,
        povertyRate: updatedPoverty,
        floodHazardLevel: updatedFlood,
        rainfallAnnualMm: updatedRainfall,
        infrastructureScore: updatedInfra,
        compositeVulnerabilityScore: assessment.compositeScore,
        vulnerabilityCategory: assessment.category,
        dataCompletenessPct: assessment.completenessPct,
      },
    });

    // Save assessment record
    if (config) {
      const savedAssessment = await prisma.vulnerabilityAssessment.create({
        data: {
          communityId: community.id,
          configId: config.id,
          configVersion: config.version,
          compositeScore: assessment.compositeScore,
          category: assessment.category,
          populationScore: assessment.contributions.find((c) => c.factorKey === "population")?.normalizedScore || 0,
          waterScore: assessment.contributions.find((c) => c.factorKey === "water")?.normalizedScore || 0,
          sanitationScore: assessment.contributions.find((c) => c.factorKey === "sanitation")?.normalizedScore || 0,
          socioeconomicScore: assessment.contributions.find((c) => c.factorKey === "socioeconomic")?.normalizedScore || 0,
          climateScore: assessment.contributions.find((c) => c.factorKey === "climate")?.normalizedScore || 0,
          infrastructureScore: assessment.contributions.find((c) => c.factorKey === "infrastructure")?.normalizedScore || 0,
          completenessPct: assessment.completenessPct,
          missingFactorsJson: JSON.stringify(assessment.missingFactors),
          notes: "Updated record recalculation: " + assessment.formulaExplanation,
        },
      });

      for (const factor of assessment.contributions) {
        await prisma.vulnerabilityContribution.create({
          data: {
            assessmentId: savedAssessment.id,
            factorName: factor.factorName,
            rawValue: factor.rawValue ?? 0,
            normalizedScore: factor.normalizedScore,
            weight: factor.weight,
            weightedContribution: factor.weightedContribution,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UPDATE",
        entityType: "Community",
        entityId: community.id,
        detailsJson: JSON.stringify({ changes: body, newScore: assessment.compositeScore }),
      },
    });

    return NextResponse.json({ success: true, data: community });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update community: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canManageUsers")) {
      return NextResponse.json({ error: "Unauthorized. Administrator privileges required." }, { status: 403 });
    }

    const { id } = await params;
    await prisma.community.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Community deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
