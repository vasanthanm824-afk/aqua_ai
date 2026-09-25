import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { calculateVulnerability, DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canImportData")) {
      return NextResponse.json(
        { error: "Unauthorized. Analyst or Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      sourceId,
      category,
      fileName,
      fileFormat = "CSV",
      records, // Array of mapped record objects
      overwriteExisting = false,
    } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No data records provided for import" },
        { status: 400 }
      );
    }

    // Create DatasetImport record
    const datasetImport = await prisma.datasetImport.create({
      data: {
        sourceId: sourceId || null,
        fileName: fileName || "user_dataset_import.csv",
        fileFormat: fileFormat.toUpperCase(),
        category: category || "WATER_ACCESS",
        totalRecords: records.length,
        status: "PROCESSING",
        importedByUserId: session.id,
      },
    });

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

    let validCount = 0;
    let invalidCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      // Indian administrative hierarchy validation
      const name = row.name || row.community_name || row.gram_panchayat || row.village || row.Village || row.Community;
      const state = row.state || row.State || "Tamil Nadu";
      const district = row.district || row.District || "Ramanathapuram";
      const block = row.block || row.Block || row.taluk || row.Taluk || "Mandapam";
      const region = row.region || `${district} District`;
      const country = "India";
      const rawLat = row.latitude ?? row.lat ?? row.Latitude;
      const rawLng = row.longitude ?? row.lng ?? row.lon ?? row.Longitude;
      const rawPop = row.population ?? row.pop ?? row.census_2011_population ?? row.Population;

      if (!name) {
        errors.push(`Row ${rowNum}: Missing village / Gram Panchayat name`);
        invalidCount++;
        continue;
      }

      const lat = parseFloat(rawLat);
      const lng = parseFloat(rawLng);

      if (isNaN(lat) || isNaN(lng) || lat < 6.0 || lat > 38.0 || lng < 68.0 || lng > 98.0) {
        errors.push(`Row ${rowNum} (${name}): GPS coordinates [${rawLat}, ${rawLng}] are outside India bounding box [6°-38°N, 68°-98°E]`);
        invalidCount++;
        continue;
      }

      const population = parseInt(rawPop || "4500", 10);
      if (isNaN(population) || population < 1) {
        errors.push(`Row ${rowNum} (${name}): Invalid population value`);
        invalidCount++;
        continue;
      }

      const waterAccessPct = row.waterAccessPct !== undefined ? parseFloat(row.waterAccessPct) : row.jjm_tap_water_coverage_pct !== undefined ? parseFloat(row.jjm_tap_water_coverage_pct) : 48;
      const sanitationAccessPct = row.sanitationAccessPct !== undefined ? parseFloat(row.sanitationAccessPct) : row.sbm_sanitation_coverage_pct !== undefined ? parseFloat(row.sbm_sanitation_coverage_pct) : 52;
      const povertyRate = row.povertyRate !== undefined ? parseFloat(row.povertyRate) : row.nfhs_deprivation_index !== undefined ? parseFloat(row.nfhs_deprivation_index) : 42;
      const rainfallAnnualMm = row.rainfallAnnualMm !== undefined ? parseFloat(row.rainfallAnnualMm) : row.imd_annual_rainfall_mm !== undefined ? parseFloat(row.imd_annual_rainfall_mm) : 820;
      const floodHazardLevel = row.floodHazardLevel || row.cwc_flood_hazard_level || "Moderate";
      const infrastructureScore = row.infrastructureScore !== undefined ? parseFloat(row.infrastructureScore) : row.twad_infrastructure_score !== undefined ? parseFloat(row.twad_infrastructure_score) : 50;

      const code = row.code || `IND-TN-${name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Run vulnerability calculation with 6 factors
      const assessment = calculateVulnerability(
        {
          population,
          waterAccessPct,
          sanitationAccessPct,
          povertyRate,
          rainfallAnnualMm,
          floodHazardLevel,
          infrastructureScore,
        },
        weights
      );

      // Check if community exists
      const existingCommunity = await prisma.community.findFirst({
        where: {
          OR: [
            { code },
            { name: { equals: name } },
          ],
        },
      });

      let communityId = "";

      if (existingCommunity) {
        if (!overwriteExisting) {
          errors.push(`Row ${rowNum} (${name}): Community exists (code: ${existingCommunity.code}). Set overwrite to update.`);
          invalidCount++;
          continue;
        }

        // Update existing community
        const updated = await prisma.community.update({
          where: { id: existingCommunity.id },
          data: {
            state,
            district,
            block,
            country,
            population,
            waterAccessPct,
            sanitationAccessPct,
            povertyRate,
            rainfallAnnualMm,
            floodHazardLevel,
            infrastructureScore,
            compositeVulnerabilityScore: assessment.compositeScore,
            vulnerabilityCategory: assessment.category,
            dataCompletenessPct: assessment.completenessPct,
            isSampleData: false, // User imported real data
          },
        });
        communityId = updated.id;
      } else {
        // Create new community
        const created = await prisma.community.create({
          data: {
            name,
            code,
            state,
            district,
            block,
            country,
            latitude: lat,
            longitude: lng,
            population,
            waterAccessPct,
            sanitationAccessPct,
            povertyRate,
            rainfallAnnualMm,
            floodHazardLevel,
            infrastructureScore,
            compositeVulnerabilityScore: assessment.compositeScore,
            vulnerabilityCategory: assessment.category,
            dataCompletenessPct: assessment.completenessPct,
            isSampleData: false,
          },
        });
        communityId = created.id;
      }

      // Record DatasetRecord provenance
      await prisma.datasetRecord.create({
        data: {
          importId: datasetImport.id,
          communityId,
          sourceId: sourceId || null,
          indicatorKey: category || "WATER_ACCESS",
          rawValue: JSON.stringify(row),
          normalizedValue: assessment.compositeScore,
          dataYear: new Date().getFullYear(),
          provenanceJson: JSON.stringify({
            importDate: new Date(),
            sourceId: sourceId || "User CSV Upload",
            fileName,
            importedBy: session.name,
          }),
        },
      });

      validCount++;
    }

    // Update dataset import status
    await prisma.datasetImport.update({
      where: { id: datasetImport.id },
      data: {
        validRecords: validCount,
        invalidRecords: invalidCount,
        status: invalidCount > 0 && validCount === 0 ? "FAILED" : "COMPLETED",
        errorLog: errors.length > 0 ? errors.slice(0, 50).join("\n") : null,
      },
    });

    if (sourceId) {
      await prisma.dataSource.update({
        where: { id: sourceId },
        data: { lastUpdated: new Date() },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "IMPORT",
        entityType: "DatasetImport",
        entityId: datasetImport.id,
        detailsJson: JSON.stringify({
          fileName,
          total: records.length,
          valid: validCount,
          invalid: invalidCount,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      importId: datasetImport.id,
      totalRecords: records.length,
      validRecords: validCount,
      invalidRecords: invalidCount,
      errors: errors.slice(0, 20),
    });
  } catch (error: any) {
    console.error("POST /api/import error:", error);
    return NextResponse.json(
      { error: "Import processing failed: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const imports = await prisma.datasetImport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        source: {
          select: { datasetTitle: true, sourceAgency: true },
        },
        importedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: imports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
