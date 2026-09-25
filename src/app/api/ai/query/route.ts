import { NextResponse } from "next/server";
import { parseNaturalLanguageQuery } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const parsed = parseNaturalLanguageQuery(query);
    const where: any = {};

    if (parsed.maxWaterAccess !== undefined) {
      where.waterAccessPct = { lte: parsed.maxWaterAccess };
    }
    if (parsed.floodHazardOnly) {
      where.floodHazardLevel = { in: ["High", "Severe", "Catastrophic"] };
    }
    if (parsed.maxDataCompleteness !== undefined) {
      where.dataCompletenessPct = { lte: parsed.maxDataCompleteness };
    }
    if (parsed.minVulnerabilityScore !== undefined) {
      where.compositeVulnerabilityScore = { gte: parsed.minVulnerabilityScore };
    }
    if (parsed.district) {
      where.district = parsed.district;
    }

    const communities = await prisma.community.findMany({
      where,
      orderBy: { compositeVulnerabilityScore: "desc" },
      take: 25,
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
        floodHazardLevel: true,
        compositeVulnerabilityScore: true,
        vulnerabilityCategory: true,
        dataCompletenessPct: true,
      },
    });

    return NextResponse.json({
      success: true,
      interpretation: parsed.description,
      filterType: parsed.filterType,
      resultsCount: communities.length,
      communities,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
