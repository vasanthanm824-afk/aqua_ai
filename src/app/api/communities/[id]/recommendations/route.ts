import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateRiskDrivers, generateActionRecommendations } from "@/lib/recommendations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        interventions: {
          select: { id: true, title: true, status: true, priority: true },
        },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Query active citizen complaints to integrate as corroborating evidence (Requirement 13)
    const activeComplaints = await prisma.complaint.findMany({
      where: {
        communityId: id,
        status: { in: ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"] },
      },
      select: { category: true, verificationStatus: true },
    });

    const complaintSignals = {
      waterComplaints: activeComplaints.filter((c) =>
        ["WATER_SUPPLY", "WATER_QUALITY"].includes(c.category)
      ).length,
      sanitationComplaints: activeComplaints.filter((c) => c.category === "SANITATION").length,
      floodComplaints: activeComplaints.filter((c) =>
        ["FLOODING", "DRAINAGE"].includes(c.category)
      ).length,
      verifiedComplaints: activeComplaints.filter((c) => c.verificationStatus === "VERIFIED").length,
      totalComplaints: activeComplaints.length,
    };

    // Evaluate risk drivers and generate recommendations with complaint corroboration
    const riskDrivers = evaluateRiskDrivers(community);
    const recommendations = generateActionRecommendations(community, complaintSignals);

    return NextResponse.json({
      success: true,
      community: {
        id: community.id,
        name: community.name,
        code: community.code,
        district: community.district,
        block: community.block,
        state: community.state,
        country: community.country,
        compositeVulnerabilityScore: community.compositeVulnerabilityScore,
        vulnerabilityCategory: community.vulnerabilityCategory,
      },
      riskDrivers,
      recommendations,
      disclaimer: "Scenario Estimate — based on configured assumptions, not a guaranteed prediction. Does not modify official community risk scores.",
    });
  } catch (error: any) {
    console.error("GET /api/communities/[id]/recommendations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
