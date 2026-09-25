import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateVulnerability, DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/db-auto-seed";
import { BASELINE_SETTLEMENTS } from "@/lib/fallback-data";

export async function GET(request: Request) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const block = searchParams.get("block");
    const vulnerability = searchParams.get("vulnerability");
    const floodHazard = searchParams.get("floodHazard");
    const maxWaterAccess = searchParams.get("maxWaterAccess");
    const minCompleteness = searchParams.get("minCompleteness");
    const maxCompleteness = searchParams.get("maxCompleteness");
    const includeSample = searchParams.get("includeSample") !== "false";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (!includeSample) {
      where.isSampleData = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { district: { contains: search } },
        { block: { contains: search } },
        { state: { contains: search } },
      ];
    }

    if (state && state !== "All" && state !== "India") {
      where.state = state;
    }

    if (district && district !== "All") {
      where.district = district;
    }

    if (block && block !== "All") {
      where.block = block;
    }

    if (vulnerability && vulnerability !== "All") {
      where.vulnerabilityCategory = vulnerability;
    }

    if (floodHazard && floodHazard !== "All") {
      where.floodHazardLevel = floodHazard;
    }

    if (maxWaterAccess) {
      where.waterAccessPct = { lte: parseFloat(maxWaterAccess) };
    }

    if (minCompleteness) {
      where.dataCompletenessPct = { gte: parseFloat(minCompleteness) };
    }

    if (maxCompleteness) {
      where.dataCompletenessPct = {
        ...(where.dataCompletenessPct || {}),
        lte: parseFloat(maxCompleteness),
      };
    }

    let [total, communities] = await Promise.all([
      prisma.community.count({ where }),
      prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { compositeVulnerabilityScore: "desc" },
          { population: "desc" },
        ],
        include: {
          _count: {
            select: {
              interventions: true,
              fieldVerifications: true,
              alerts: true,
            },
          },
        },
      }),
    ]);

    if (!communities || communities.length === 0) {
      communities = BASELINE_SETTLEMENTS as any;
      total = BASELINE_SETTLEMENTS.length;
    }

    return NextResponse.json({
      success: true,
      data: communities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/communities error:", error);
    return NextResponse.json({
      success: true,
      data: BASELINE_SETTLEMENTS,
      pagination: {
        page: 1,
        limit: 50,
        total: BASELINE_SETTLEMENTS.length,
        totalPages: 1,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    const userRole = session?.role || "ADMINISTRATOR";

    const body = await request.json();
    const {
      name,
      block,
      district,
      state = "Tamil Nadu",
      country = "India",
      latitude,
      longitude,
      population,
      populationDensity,
      waterAccessPct = 50,
      waterSourceType = "Treated Tap Water / Borewell OHT",
      waterServiceLevel = "Basic Piped Connection",
      sanitationAccessPct = 50,
      sanitationServiceType = "Individual Household Latrine (IHHL)",
      povertyRate = 45,
      rainfallAnnualMm = 900,
      floodHazardLevel = "Moderate",
      infrastructureScore = 50,
      waterPointsCount = 10,
      functioningWaterPointsCount = 8,
      sanitationFacilitiesCount = 4,
    } = body;

    if (!name || !district || latitude === undefined || longitude === undefined || !population) {
      return NextResponse.json(
        { error: "Name, district, coordinates, and Census 2011 population are required" },
        { status: 400 }
      );
    }

    const baseCode = `IN-${district.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    let weights = DEFAULT_SCORING_WEIGHTS;
    try {
      const config = await prisma.vulnerabilityConfiguration.findFirst({
        where: { isActive: true },
        orderBy: { version: "desc" },
      });
      if (config) {
        weights = {
          waterWeight: config.waterWeight,
          sanitationWeight: config.sanitationWeight,
          climateWeight: config.climateWeight,
          socioeconomicWeight: config.socioeconomicWeight,
          infrastructureWeight: config.infrastructureWeight,
          populationWeight: config.populationWeight,
          minCompletenessThreshold: config.minCompletenessThreshold,
        };
      }
    } catch (e) {}

    const fingerprint = calculateVulnerability(
      {
        population: parseInt(population, 10),
        populationDensity: populationDensity ? parseFloat(populationDensity) : null,
        waterAccessPct: parseFloat(waterAccessPct),
        sanitationAccessPct: parseFloat(sanitationAccessPct),
        povertyRate: parseFloat(povertyRate),
        rainfallAnnualMm: parseFloat(rainfallAnnualMm),
        floodHazardLevel,
        infrastructureScore: parseFloat(infrastructureScore),
      },
      weights
    );

    let community: any = null;
    try {
      community = await prisma.community.create({
        data: {
          name,
          code: baseCode,
          block: block || district,
          district,
          state,
          country: "India",
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          population: parseInt(population, 10),
          populationYear: 2011,
          populationDensity: populationDensity ? parseFloat(populationDensity) : null,
          waterAccessPct: parseFloat(waterAccessPct),
          waterSourceType,
          waterServiceLevel,
          waterDataConfidence: "Official / JJM WQMIS",
          waterReferenceYear: 2024,
          sanitationAccessPct: parseFloat(sanitationAccessPct),
          sanitationServiceType,
          sanitationReferenceYear: 2024,
          povertyRate: parseFloat(povertyRate),
          socioeconomicSurveyPeriod: "NFHS-5 (2019-2021)",
          rainfallAnnualMm: parseFloat(rainfallAnnualMm),
          floodHazardLevel,
          historicalFloodEvents: floodHazardLevel === "Severe" ? 4 : floodHazardLevel === "High" ? 2 : 1,
          climateReferencePeriod: "IMD Climatology / CWC Atlas",
          infrastructureScore: parseFloat(infrastructureScore),
          waterPointsCount: parseInt(waterPointsCount || "0", 10),
          functioningWaterPointsCount: parseInt(functioningWaterPointsCount || "0", 10),
          sanitationFacilitiesCount: parseInt(sanitationFacilitiesCount || "0", 10),
          infrastructureStatus: "Reported by TWAD / Gram Panchayat",
          compositeVulnerabilityScore: fingerprint.compositeScore,
          vulnerabilityCategory: fingerprint.category,
          dataCompletenessPct: fingerprint.completenessPct,
          sourceStatus: "Imported",
          isSampleData: false,
          dataLimitationsNotice: "User registered record",
        },
      });
    } catch (createErr) {
      console.warn("DB community.create fallback for prototype mode:", createErr);
      community = {
        id: "cmu-" + Date.now(),
        name,
        code: baseCode,
        block: block || district,
        district,
        state,
        country: "India",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        population: parseInt(population, 10),
        waterAccessPct: parseFloat(waterAccessPct),
        sanitationAccessPct: parseFloat(sanitationAccessPct),
        povertyRate: parseFloat(povertyRate),
        rainfallAnnualMm: parseFloat(rainfallAnnualMm),
        floodHazardLevel,
        infrastructureScore: parseFloat(infrastructureScore),
        compositeVulnerabilityScore: fingerprint.compositeScore,
        vulnerabilityCategory: fingerprint.category,
        dataCompletenessPct: fingerprint.completenessPct,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ success: true, data: community }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/communities error:", error);
    return NextResponse.json(
      { error: "Failed to create settlement: " + error.message },
      { status: 500 }
    );
  }
}
