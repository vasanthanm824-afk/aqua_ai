import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCommunityIntelligenceReport } from "@/lib/ai";
import { generateInterventionRecommendations } from "@/lib/recommendations";

export async function POST(request: Request) {
  try {
    const { communityId } = await request.json();

    if (!communityId) {
      return NextResponse.json({ error: "Community ID is required" }, { status: 400 });
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Generate analytical synthesis
    const report = await generateCommunityIntelligenceReport(community);

    // Generate rule-based recommendations
    const recommendations = generateInterventionRecommendations({
      name: community.name,
      district: community.district,
      state: community.state,
      population: community.population,
      waterAccessPct: community.waterAccessPct,
      sanitationAccessPct: community.sanitationAccessPct,
      povertyRate: community.povertyRate,
      floodHazardLevel: community.floodHazardLevel,
      infrastructureScore: community.infrastructureScore,
      waterPointsCount: community.waterPointsCount,
      functioningWaterPointsCount: community.functioningWaterPointsCount,
      dataCompletenessPct: community.dataCompletenessPct,
    });

    return NextResponse.json({
      success: true,
      community: {
        id: community.id,
        name: community.name,
        code: community.code,
        state: community.state,
        district: community.district,
        block: community.block,
        population: community.population,
        waterAccessPct: community.waterAccessPct,
        sanitationAccessPct: community.sanitationAccessPct,
        floodHazardLevel: community.floodHazardLevel,
        compositeVulnerabilityScore: community.compositeVulnerabilityScore,
        vulnerabilityCategory: community.vulnerabilityCategory,
      },
      report,
      recommendations,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
