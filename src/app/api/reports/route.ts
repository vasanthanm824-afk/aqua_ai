import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "vulnerability";
    const format = searchParams.get("format") || "json";

    const communities = await prisma.community.findMany({
      orderBy: { compositeVulnerabilityScore: "desc" },
      include: {
        interventions: true,
        fieldVerifications: true,
      },
    });

    const activeConfig = await prisma.vulnerabilityConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });

    let reportData: any[] = [];
    let title = "AQUA-LENS India Intelligence Report";

    if (type === "water") {
      title = "AQUA-LENS Jal Jeevan Mission (JJM) Piped Water Access Deficit Report";
      reportData = communities.map((c) => ({
        Code: c.code,
        Village_or_GP: c.name,
        Block: c.block,
        District: c.district,
        State: c.state,
        Population_Census2011: c.population,
        JJM_Tap_Water_Coverage_Pct: `${c.waterAccessPct}%`,
        Unserved_Households_Pop: Math.round(c.population * (1 - c.waterAccessPct / 100)),
        Water_Source_Type: c.waterSourceType,
        Service_Level: c.waterServiceLevel,
        Active_Public_Taps: `${c.functioningWaterPointsCount}/${c.waterPointsCount}`,
        Data_Source: "JJM / WQMIS (Water Quality Management Information System)",
      }));
    } else if (type === "sanitation") {
      title = "AQUA-LENS Swachh Bharat Mission (Grameen) Coverage & ODF Status Report";
      reportData = communities.map((c) => ({
        Code: c.code,
        Village_or_GP: c.name,
        Block: c.block,
        District: c.district,
        State: c.state,
        Population_Census2011: c.population,
        SBM_IHHL_Coverage_Pct: `${c.sanitationAccessPct}%`,
        Unserved_Population: Math.round(c.population * (1 - c.sanitationAccessPct / 100)),
        Service_Type: c.sanitationServiceType,
        Community_Sanitary_Complexes: c.sanitationFacilitiesCount,
        Data_Source: "Swachh Bharat Mission - Grameen (data.gov.in)",
      }));
    } else if (type === "flood") {
      title = "AQUA-LENS IMD Rainfall & CWC Hydrological Flood Hazard Exposure Report";
      reportData = communities.map((c) => ({
        Code: c.code,
        Village_or_GP: c.name,
        Block: c.block,
        District: c.district,
        State: c.state,
        CWC_Flood_Hazard_Level: c.floodHazardLevel,
        IMD_Annual_Rainfall_Normal_mm: `${c.rainfallAnnualMm} mm`,
        Historical_Inundation_Events: c.historicalFloodEvents,
        Exposed_Population: ["High", "Severe", "Catastrophic"].includes(c.floodHazardLevel) ? c.population : 0,
        TWAD_Infra_Resilience_Score: `${c.infrastructureScore}/100`,
        Data_Source: "India Meteorological Dept (IMD) / Central Water Commission (CWC)",
      }));
    } else if (type === "interventions") {
      title = "AQUA-LENS Indian WASH Infrastructure Interventions & Works Pipeline";
      const interventions = await prisma.intervention.findMany({
        include: {
          community: true,
          assignedOfficer: true,
        },
      });
      reportData = interventions.map((i) => ({
        InterventionID: i.id,
        Village_or_GP: i.community.name,
        Block: i.community.block,
        District: i.community.district,
        State: i.community.state,
        Scheme_Title: i.title,
        Category: i.issueCategory,
        Priority: i.priority,
        Status: i.status,
        Nodal_Agency: i.assignedOrg || "TWAD Board / JJM Directorate",
        Nodal_Officer: i.assignedOfficer?.name || "Unassigned",
        Estimated_Budget_INR: `₹${(i.estimatedBudget / 100000).toFixed(2)} Lakhs`,
        Target_Launch_Date: i.proposedStartDate?.toISOString().split("T")[0] || "TBD",
      }));
    } else {
      // Default: Comprehensive Vulnerability Assessment Report
      title = "AQUA-LENS India District Vulnerability & Water-Sanitation Composite Index";
      reportData = communities.map((c) => ({
        Code: c.code,
        Village_or_GP: c.name,
        Block: c.block,
        District: c.district,
        State: c.state,
        Census_2011_Population: c.population,
        Composite_Vulnerability_Score: c.compositeVulnerabilityScore,
        Modelled_Category: c.vulnerabilityCategory,
        JJM_Tap_Water_Pct: `${c.waterAccessPct}%`,
        SBM_Sanitation_Pct: `${c.sanitationAccessPct}%`,
        NFHS_Deprivation_Pct: `${c.povertyRate}%`,
        CWC_Flood_Hazard: c.floodHazardLevel,
        TWAD_Infra_Score: `${c.infrastructureScore}/100`,
        Data_Completeness: `${c.dataCompletenessPct}%`,
        Status: c.isSampleData ? "Illustrative Demo Dataset (Non-Official)" : "Verified Field Survey",
      }));
    }

    if (format === "csv") {
      if (reportData.length === 0) {
        return new Response("No data available for export", { status: 404 });
      }
      const headers = Object.keys(reportData[0]).join(",");
      const rows = reportData.map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",")
      );
      const csv = [headers, ...rows].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aqua_lens_${type}_report_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      title,
      reportType: type,
      timestamp: new Date().toISOString(),
      policyVersion: activeConfig?.version || 1,
      totalRecords: reportData.length,
      data: reportData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
