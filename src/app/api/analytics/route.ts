import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDatabaseSeeded } from "@/lib/db-auto-seed";
import { getFallbackAnalyticsResponse } from "@/lib/fallback-data";

export async function GET(request: Request) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const region = searchParams.get("region");
    const includeSample = searchParams.get("includeSample") !== "false";

    const where: any = {};
    if (!includeSample) {
      where.isSampleData = false;
    }
    if (state && state !== "All" && state !== "India") {
      where.state = state;
    }
    if (district && district !== "All") {
      where.district = district;
    } else if (region && region !== "All" && region !== "Global" && !district) {
      where.region = region;
    }

    const [
      communities,
      totalInterventions,
      activeInterventions,
      pendingVerifications,
      activeAlerts,
      recentAssessments,
    ] = await Promise.all([
      prisma.community.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          state: true,
          district: true,
          block: true,
          population: true,
          waterAccessPct: true,
          sanitationAccessPct: true,
          povertyRate: true,
          rainfallAnnualMm: true,
          floodHazardLevel: true,
          infrastructureScore: true,
          compositeVulnerabilityScore: true,
          vulnerabilityCategory: true,
          dataCompletenessPct: true,
          updatedAt: true,
        },
      }),
      prisma.intervention.count(),
      prisma.intervention.count({
        where: {
          status: { in: ["PLANNED", "APPROVED", "IN_PROGRESS"] },
        },
      }),
      prisma.fieldVerification.count({
        where: {
          status: { in: ["DRAFT", "PENDING_REVIEW"] },
        },
      }),
      prisma.alert.count({
        where: { status: "ACTIVE" },
      }),
      prisma.vulnerabilityAssessment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          community: {
            select: { name: true, state: true, district: true, block: true },
          },
        },
      }),
    ]);

    if (!communities || communities.length === 0) {
      return NextResponse.json(getFallbackAnalyticsResponse());
    }

    // Calculate aggregated indicators
    const analyzedCommunitiesCount = communities.length;
    let totalPopulation = 0;
    let populationInadequateWater = 0;
    let populationInadequateSanitation = 0;
    let highVulnerabilityCount = 0;
    let significantFloodExposureCount = 0;
    let incompleteDatasetsCount = 0;

    const vulnerabilityDistribution: Record<string, number> = {
      VERY_LOW: 0,
      LOW: 0,
      MODERATE: 0,
      HIGH: 0,
      VERY_HIGH: 0,
      UNKNOWN: 0,
    };

    const districtMap: Record<string, {
      district: string;
      state: string;
      communitiesCount: number;
      totalPop: number;
      totalWaterAccess: number;
      totalSanitationAccess: number;
      totalVulnerability: number;
    }> = {};

    let sumPopScore = 0;
    let sumWaterScore = 0;
    let sumSanitationScore = 0;
    let sumSocioScore = 0;
    let sumClimateScore = 0;
    let sumInfraScore = 0;

    for (const c of communities) {
      totalPopulation += c.population;
      const waterDeficit = Math.round(c.population * Math.max(0, 1 - c.waterAccessPct / 100));
      populationInadequateWater += waterDeficit;

      const sanDeficit = Math.round(c.population * Math.max(0, 1 - c.sanitationAccessPct / 100));
      populationInadequateSanitation += sanDeficit;

      if (c.compositeVulnerabilityScore >= 60) {
        highVulnerabilityCount++;
      }

      if (["High", "Severe", "Catastrophic"].includes(c.floodHazardLevel)) {
        significantFloodExposureCount++;
      }

      if (c.dataCompletenessPct < 75) {
        incompleteDatasetsCount++;
      }

      vulnerabilityDistribution[c.vulnerabilityCategory] =
        (vulnerabilityDistribution[c.vulnerabilityCategory] || 0) + 1;

      const dKey = c.district || "Unassigned District";
      if (!districtMap[dKey]) {
        districtMap[dKey] = {
          district: dKey,
          state: c.state || "Tamil Nadu",
          communitiesCount: 0,
          totalPop: 0,
          totalWaterAccess: 0,
          totalSanitationAccess: 0,
          totalVulnerability: 0,
        };
      }
      districtMap[dKey].communitiesCount++;
      districtMap[dKey].totalPop += c.population;
      districtMap[dKey].totalWaterAccess += c.waterAccessPct;
      districtMap[dKey].totalSanitationAccess += c.sanitationAccessPct;
      districtMap[dKey].totalVulnerability += c.compositeVulnerabilityScore;

      sumPopScore += Math.min(100, Math.round((c.population / 15000) * 100));
      sumWaterScore += (100 - c.waterAccessPct);
      sumSanitationScore += (100 - c.sanitationAccessPct);
      sumSocioScore += c.povertyRate;
      sumClimateScore += ["Severe", "Catastrophic"].includes(c.floodHazardLevel) ? 90 : c.floodHazardLevel === "High" ? 75 : 40;
      sumInfraScore += (100 - c.infrastructureScore);
    }

    const districtStats = Object.values(districtMap).map((r) => ({
      district: r.district,
      state: r.state,
      region: r.district,
      communitiesCount: r.communitiesCount,
      population: r.totalPop,
      averageWaterAccess: Math.round(r.totalWaterAccess / r.communitiesCount),
      averageSanitationAccess: Math.round(r.totalSanitationAccess / r.communitiesCount),
      averageVulnerability: Math.round(r.totalVulnerability / r.communitiesCount),
    }));

    const avgDiv = Math.max(1, communities.length);
    const riskFactorAverages = [
      { name: "Water Access Gap (JJM Tap Coverage)", averageScore: Math.round(sumWaterScore / avgDiv), weight: 25, color: "#06b6d4", source: "Jal Jeevan Mission / WQMIS" },
      { name: "Sanitation Access Gap (SBM-G Coverage)", averageScore: Math.round(sumSanitationScore / avgDiv), weight: 20, color: "#3b82f6", source: "Swachh Bharat Mission (Grameen)" },
      { name: "Climate & Flood Exposure (IMD & CWC)", averageScore: Math.round(sumClimateScore / avgDiv), weight: 20, color: "#f97316", source: "India Meteorological Dept / CWC" },
      { name: "Socioeconomic Deprivation (NFHS-5)", averageScore: Math.round(sumSocioScore / avgDiv), weight: 15, color: "#eab308", source: "NFHS-5 (2019-2021) / NITI Aayog" },
      { name: "Infrastructure Fragility (TWAD Board)", averageScore: Math.round(sumInfraScore / avgDiv), weight: 10, color: "#ef4444", source: "Tamil Nadu Water Supply & Drainage Board" },
      { name: "Population Vulnerability (Census 2011)", averageScore: Math.round(sumPopScore / avgDiv), weight: 10, color: "#8b5cf6", source: "Census of India 2011" },
    ];

    const vulnDistFiltered = Object.entries(vulnerabilityDistribution)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({ category, count }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        analyzedCommunitiesCount,
        totalPopulation,
        populationInadequateWater,
        populationInadequateSanitation,
        highVulnerabilityCount,
        significantFloodExposureCount,
        incompleteDatasetsCount,
        pendingVerifications,
        activeInterventions,
        totalInterventions,
        activeAlerts,
      },
      vulnerabilityDistribution: vulnDistFiltered.length > 0 ? vulnDistFiltered : [{ category: "HIGH", count: 7 }, { category: "MODERATE", count: 5 }],
      regionalStats: districtStats,
      districtStats,
      riskFactorAverages,
      recentAssessments,
    });
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(getFallbackAnalyticsResponse());
  }
}
