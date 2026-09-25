import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateRiskDrivers, generateActionRecommendations } from "@/lib/recommendations";
import { DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";

export interface AskAquaLensRequest {
  question: string;
  communityId?: string | null;
  history?: Array<{ role: "user" | "assistant"; content: string; matchedIds?: string[] }>;
}

export interface CommunitySummaryMatch {
  id: string;
  name: string;
  district: string;
  block: string | null;
  state: string;
  score: number;
  category: string;
  waterAccessPct: number;
  sanitationAccessPct: number;
  floodHazardLevel: string;
  povertyRate: number;
  infrastructureScore: number;
  population: number;
  latitude: number;
  longitude: number;
  isSampleData: boolean;
}

export async function POST(request: Request) {
  try {
    const body: AskAquaLensRequest = await request.json();
    const { question, communityId, history = [] } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    const q = question.toLowerCase().trim();

    // 1. Fetch relevant database evidence
    // Check if this is a follow-up referring to "these", "those", "them" from previous history
    const isFollowUp = (q.includes("these") || q.includes("those") || q.includes("them") || q.includes("of which")) && history.length > 0;
    let candidateIds: string[] | undefined = undefined;
    if (isFollowUp) {
      // Find the last assistant message with matchedIds
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].matchedIds && history[i].matchedIds!.length > 0) {
          candidateIds = history[i].matchedIds;
          break;
        }
      }
    }

    // Load active communities from SQLite database
    const allCommunities = await prisma.community.findMany({
      where: candidateIds ? { id: { in: candidateIds } } : undefined,
      select: {
        id: true,
        name: true,
        code: true,
        district: true,
        block: true,
        state: true,
        latitude: true,
        longitude: true,
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
        isSampleData: true,
        dataLimitationsNotice: true,
      },
      orderBy: { compositeVulnerabilityScore: "desc" },
    });

    // Load data sources for provenance citations
    const dataSources = await prisma.dataSource.findMany({
      take: 6,
      select: {
        datasetTitle: true,
        sourceAgency: true,
        referencePeriod: true,
        sourceStatus: true,
        units: true,
        category: true,
      },
    });

    // 2. Identify Context Community if supplied or mentioned by name
    let contextCommunity = communityId
      ? allCommunities.find((c) => c.id === communityId)
      : null;

    if (!contextCommunity) {
      // Check if user specifically named a community
      for (const comm of allCommunities) {
        const cName = comm.name.toLowerCase();
        const baseName = cName.replace("habitation", "").replace("village", "").replace("panchayat", "").trim();
        if (q.includes(baseName) || q.includes(cName)) {
          contextCommunity = comm;
          break;
        }
      }
    }

    // 3. Structured Intent Detection Layer
    const hasWaterMention = q.includes("water") || q.includes("drinking") || q.includes("tap") || q.includes("fhtc") || q.includes("jjm");
    const hasSanitationMention = q.includes("sanitation") || q.includes("toilet") || q.includes("latrine") || q.includes("ihhl") || q.includes("sbm");
    const hasFloodMention = q.includes("flood") || q.includes("cyclone") || q.includes("surge") || q.includes("cwc") || q.includes("inundat");
    const hasPovertyMention = q.includes("poverty") || q.includes("deprivation") || q.includes("income") || q.includes("socioeconomic") || q.includes("nfhs");
    const hasInfraMention = q.includes("infrastructure") || q.includes("pump") || q.includes("oht") || q.includes("twad") || q.includes("broken");
    const hasInterventionMention = q.includes("intervention") || q.includes("recommend") || q.includes("solution") || q.includes("action") || q.includes("plan");
    const hasScoreFormulaMention = q.includes("calculate") || q.includes("formula") || q.includes("weight") || q.includes("fingerprint") || q.includes("contribut");
    const hasConfidenceMention = q.includes("confidence") || q.includes("quality") || q.includes("reliable") || q.includes("audit") || q.includes("missing") || q.includes("provenance");
    const hasCompareMention = q.includes("compare") || q.includes("difference") || q.includes("versus") || q.includes("vs");
    const hasComplaintMention = q.includes("complaint") || q.includes("grievance") || q.includes("unresolved") || q.includes("reported") || q.includes("verification") || q.includes("waiting") || q.includes("hotspot");

    // Filter districts if mentioned
    let targetDistrict: string | null = null;
    if (q.includes("ramanathapuram") || q.includes("ramnad")) targetDistrict = "Ramanathapuram";
    else if (q.includes("cuddalore")) targetDistrict = "Cuddalore";
    else if (q.includes("nagapattinam")) targetDistrict = "Nagapattinam";
    else if (q.includes("mayiladuthurai")) targetDistrict = "Mayiladuthurai";
    else if (q.includes("dharmapuri")) targetDistrict = "Dharmapuri";
    else if (q.includes("tiruvannamalai")) targetDistrict = "Tiruvannamalai";

    let matchedCommunities: typeof allCommunities = [];

    // COMPLAINT SPECIFIC INTENT HANDLING (Requirement 14)
    if (hasComplaintMention) {
      const dbComplaints = await prisma.complaint.findMany({
        where: contextCommunity ? { communityId: contextCommunity.id } : undefined,
        include: {
          community: {
            select: {
              id: true,
              name: true,
              district: true,
              compositeVulnerabilityScore: true,
              vulnerabilityCategory: true,
            },
          },
          verifications: true,
        },
        orderBy: { createdAt: "desc" },
      });

      let filteredComplaints = dbComplaints;
      let complaintTitle = "Citizen Grievances & Verified Evidence";

      if (q.includes("sanitation")) {
        filteredComplaints = dbComplaints.filter((c) =>
          c.category === "SANITATION" && ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"].includes(c.status)
        );
        complaintTitle = "Unresolved Sanitation Grievances";
      } else if (q.includes("water")) {
        filteredComplaints = dbComplaints.filter((c) =>
          ["WATER_SUPPLY", "WATER_QUALITY"].includes(c.category) &&
          ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"].includes(c.status)
        );
        complaintTitle = "Unresolved Drinking Water Grievances";
      } else if (q.includes("flood") || q.includes("inundat")) {
        filteredComplaints = dbComplaints.filter((c) => ["FLOODING", "DRAINAGE"].includes(c.category));
        complaintTitle = "Flooding & Inundation Grievances";
      } else if (q.includes("verification") || q.includes("waiting")) {
        filteredComplaints = dbComplaints.filter((c) =>
          c.verificationStatus === "PENDING_VERIFICATION" || c.verificationStatus === "UNVERIFIED"
        );
        complaintTitle = "Grievances Awaiting Field Verification";
      } else if (q.includes("open") || q.includes("how many")) {
        filteredComplaints = dbComplaints.filter((c) =>
          ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"].includes(c.status)
        );
        complaintTitle = "Active Unresolved Complaints";
      }

      // Collect community IDs
      const communityIds = Array.from(new Set(filteredComplaints.map((c) => c.communityId).filter(Boolean))) as string[];
      matchedCommunities = allCommunities.filter((c) => communityIds.includes(c.id));

      let lines = `### 📢 ${complaintTitle} (${filteredComplaints.length} Records in Database)\n\n`;
      if (contextCommunity) {
        lines += `Showing citizen reported issues logged for **${contextCommunity.name}** (Score: ${contextCommunity.compositeVulnerabilityScore}/100):\n\n`;
      } else {
        lines += `Query of the Aqua-Lens Complaint Center returned **${filteredComplaints.length} matching grievances** across priority settlements:\n\n`;
      }

      filteredComplaints.slice(0, 5).forEach((c, idx) => {
        lines += `**${idx + 1}. [${c.complaintNumber}] ${c.title}**\n`;
        lines += `- **Category:** ${c.category.replace("_", " ")} | **Priority:** ${c.priority}\n`;
        lines += `- **Location:** ${c.locationName} (${c.community?.name || "Unassigned"})\n`;
        lines += `- **Workflow Status:** ${c.status} | **Verification:** ${c.verificationStatus}\n`;
        lines += `- **Community Vulnerability:** ${c.community ? `${c.community.compositeVulnerabilityScore}/100 (${c.community.vulnerabilityCategory})` : "N/A"}\n\n`;
      });

      if (filteredComplaints.length > 5) {
        lines += `*...plus ${filteredComplaints.length - 5} additional complaints in Complaint Center.*`;
      }

      return NextResponse.json({
        success: true,
        question,
        answer: lines,
        contextCommunityId: contextCommunity?.id || null,
        topMatches: matchedCommunities.map((c) => ({
          id: c.id,
          name: c.name,
          district: c.district,
          block: c.block,
          state: c.state,
          score: c.compositeVulnerabilityScore,
          category: c.vulnerabilityCategory,
          waterAccessPct: c.waterAccessPct,
          sanitationAccessPct: c.sanitationAccessPct,
          floodHazardLevel: c.floodHazardLevel,
          povertyRate: c.povertyRate,
          infrastructureScore: c.infrastructureScore,
          population: c.population,
          latitude: c.latitude,
          longitude: c.longitude,
          isSampleData: c.isSampleData,
        })),
        matchedIds: matchedCommunities.map((c) => c.id),
        mainContributingFactors: [
          { factor: "Citizen Grievances", score: `${filteredComplaints.length} records`, impact: "Ground truth evidence from field" },
          { factor: "Official Model", score: "Deterministic 6-Factor", impact: "Baseline scores unchanged by grievances" },
        ],
        evidenceConfidence: 92,
        dataStatus: [
          { dataset: "Citizen Grievance Stream", status: "Verified / Active", source: "Aqua-Lens Complaint Center", year: "2026" },
          { dataset: "Field Verification", status: "Official / Audit", source: "TWAD Board & District Officers", year: "2026" },
          { dataset: "Census 2011", status: "Official", source: "Census of India", year: "2011" },
        ],
        sourceCitations: [
          "Aqua-Lens Complaint & Citizen Grievance Center (State WASH Portal)",
          "Field Verification Inspection Logs (TWAD Board & DRDA)",
          "Jal Jeevan Mission & SBM-G Baseline Data",
        ],
        disclaimer: "Citizen complaints provide corroborating ground-truth intelligence and do not automatically alter deterministic risk scores.",
      });
    }

    // Specific Multi-Condition or Thematic Filtering
    if (hasFloodMention && hasSanitationMention) {
      matchedCommunities = allCommunities.filter((c) =>
        ["High", "Severe", "Catastrophic"].includes(c.floodHazardLevel) && c.sanitationAccessPct <= 55
      );
    } else if (hasWaterMention && hasFloodMention) {
      matchedCommunities = allCommunities.filter((c) =>
        ["High", "Severe", "Catastrophic"].includes(c.floodHazardLevel) && c.waterAccessPct <= 45
      );
    } else if (hasWaterMention && (q.includes("below 50") || q.includes("deficit") || q.includes("poor") || q.includes("lowest"))) {
      matchedCommunities = allCommunities.filter((c) => c.waterAccessPct <= 50);
    } else if (hasSanitationMention && (q.includes("below") || q.includes("poor") || q.includes("lowest"))) {
      matchedCommunities = allCommunities.filter((c) => c.sanitationAccessPct <= 50);
    } else if (hasFloodMention) {
      matchedCommunities = allCommunities.filter((c) => ["High", "Severe", "Catastrophic"].includes(c.floodHazardLevel));
    } else if (q.includes("high risk") || q.includes("high vulnerability") || q.includes("most vulnerable") || q.includes("priority")) {
      matchedCommunities = allCommunities.filter((c) => c.compositeVulnerabilityScore >= 65);
    } else if (targetDistrict) {
      matchedCommunities = allCommunities.filter((c) => c.district.toLowerCase() === targetDistrict!.toLowerCase());
    }

    if (targetDistrict && matchedCommunities.length > 0) {
      matchedCommunities = matchedCommunities.filter((c) => c.district.toLowerCase() === targetDistrict!.toLowerCase());
    }

    // 4. Evidence-First Answer Generation
    let answer = "";
    let mainContributingFactors: Array<{ factor: string; score: number | string; impact: string }> = [];
    let evidenceConfidence = 85;
    let dataStatusList: Array<{ dataset: string; status: string; source: string; year: string }> = [
      { dataset: "Water Access (JJM)", status: "Official / Demo", source: "Jal Jeevan Mission WQMIS", year: "2024" },
      { dataset: "Sanitation Access (SBM-G)", status: "Official / Demo", source: "Swachh Bharat Mission (OGD)", year: "2024" },
      { dataset: "Flood Hazard (CWC)", status: "Official / Modelled", source: "Central Water Commission", year: "2024" },
      { dataset: "Rainfall Climatology (IMD)", status: "Official", source: "India Meteorological Dept", year: "1981-2020 Normal" },
      { dataset: "Socioeconomic Deprivation", status: "Official / Modelled", source: "NFHS-5 (MoHFW)", year: "2019-2021" },
      { dataset: "Demographics", status: "Official", source: "Census of India", year: "2011" },
    ];

    // SCENARIO A: Context Community In-Depth Question
    if (contextCommunity && (hasScoreFormulaMention || q.includes("why") || hasInterventionMention || hasConfidenceMention || q.includes("what") || q.includes("factor"))) {
      const drivers = evaluateRiskDrivers(contextCommunity);
      const recs = generateActionRecommendations(contextCommunity);

      mainContributingFactors = drivers.map((d) => ({
        factor: d.indicatorLabel,
        score: `${d.value} ${d.unit}`,
        impact: `Threshold: ${d.thresholdLabel} (Severity: ${d.severity.toUpperCase()})`,
      }));

      if (hasInterventionMention) {
        answer = `### 🛠️ Recommended Interventions for ${contextCommunity.name} (${contextCommunity.district} District)\n\n` +
          `Based on the official Aqua-Lens rule engine and the settlement's current vulnerability score of **${contextCommunity.compositeVulnerabilityScore}/100** (${contextCommunity.vulnerabilityCategory}), the following **${recs.length} actionable interventions** are prioritized:\n\n` +
          recs.map((r, i) =>
            `**${i + 1}. ${r.interventionName}** [${r.priority} Priority]\n` +
            `- **Estimated Budget:** ${r.estimatedCostFormatted} (INR)\n` +
            `- **Trigger Reason:** ${r.reason}\n` +
            `- **${r.estimatedImpact}**\n` +
            `- *Assumption:* ${r.assumptions}\n`
          ).join("\n") +
          `\n> ⚠️ *All impacts are scenario estimates calibrated against standard state benchmarks (JJM/SBM/TWAD) and do not represent guaranteed real-world outcomes.*`;
      } else {
        answer = `### 📊 Vulnerability Signal Explanation: ${contextCommunity.name} (${contextCommunity.district}, Tamil Nadu)\n\n` +
          `The official Aqua-Lens risk engine calculates **${contextCommunity.name}** at a composite vulnerability score of **${contextCommunity.compositeVulnerabilityScore} / 100** (${contextCommunity.vulnerabilityCategory} category).\n\n` +
          `#### 🎯 Primary Risk Drivers Detected:\n` +
          drivers.map((d) => `- **${d.indicatorLabel}:** Current value is **${d.value} ${d.unit}** (Threshold: ${d.thresholdLabel}). *${d.description}*`).join("\n") +
          `\n\n#### 📐 Mathematical Weighting Breakdown:\n` +
          `The score is computed using the active 6-factor policy: Water Access Gap (25%), Sanitation Deficit (20%), Climate & Flood Exposure (20%), Socioeconomic Deprivation (15%), Infrastructure Fragility (10%), and Demographic Pressure (10%).\n\n` +
          `*Notice: Indicators reflect Census 2011 demographics, JJM 2024 connection rates, and CWC flood risk classifications tagged with demo provenance.*`;
      }

      matchedCommunities = [contextCommunity];
    }
    // SCENARIO B: Multi-Condition or Filter Query across communities
    else if (matchedCommunities.length > 0) {
      answer = `### 📍 Found ${matchedCommunities.length} Matching Communities in Aqua-Lens Database\n\n` +
        `Query criteria matched the following Indian settlements based on verified database records:\n\n` +
        matchedCommunities.slice(0, 6).map((c, i) =>
          `**${i + 1}. ${c.name}** (${c.district} District, Block: ${c.block || "Taluk"})\n` +
          `- **Vulnerability Score:** **${c.compositeVulnerabilityScore}/100** (${c.vulnerabilityCategory})\n` +
          `- **Drinking Water (JJM):** ${c.waterAccessPct}% tap connections\n` +
          `- **Sanitation (SBM-G):** ${c.sanitationAccessPct}% IHHL coverage\n` +
          `- **Hydrological Hazard:** ${c.floodHazardLevel} (CWC flood atlas)\n` +
          `- **Population (Census 2011):** ${c.population.toLocaleString()} residents\n`
        ).join("\n") +
        (matchedCommunities.length > 6 ? `\n*...plus ${matchedCommunities.length - 6} additional matching settlements available on map.*` : "");

      mainContributingFactors = [
        { factor: "Query Filters", score: `${matchedCommunities.length} matches`, impact: "Filtered from 12 total settlements" },
        { factor: "Data Baseline", score: "Census 2011, JJM, SBM-G", impact: "All values from official Indian schema" },
      ];
    }
    // SCENARIO C: Comparison between settlements
    else if (hasCompareMention && allCommunities.length >= 2) {
      const c1 = allCommunities[0];
      const c2 = allCommunities[1];
      matchedCommunities = [c1, c2];
      answer = `### ⚖️ Comparative Intelligence Assessment: ${c1.name} vs ${c2.name}\n\n` +
        `| Indicator | ${c1.name} (${c1.district}) | ${c2.name} (${c2.district}) |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **Composite Vulnerability** | **${c1.compositeVulnerabilityScore} / 100** (${c1.vulnerabilityCategory}) | **${c2.compositeVulnerabilityScore} / 100** (${c2.vulnerabilityCategory}) |\n` +
        `| **JJM Tap Water Coverage** | ${c1.waterAccessPct}% | ${c2.waterAccessPct}% |\n` +
        `| **SBM-G Sanitation** | ${c1.sanitationAccessPct}% | ${c2.sanitationAccessPct}% |\n` +
        `| **CWC Flood Hazard** | ${c1.floodHazardLevel} | ${c2.floodHazardLevel} |\n` +
        `| **NFHS-5 Deprivation** | ${c1.povertyRate}% | ${c2.povertyRate}% |\n` +
        `| **TWAD Infrastructure** | ${c1.infrastructureScore}/100 | ${c2.infrastructureScore}/100 |\n` +
        `| **Population (Census 2011)** | ${c1.population.toLocaleString()} | ${c2.population.toLocaleString()} |\n\n` +
        `**Key Contrast:** ${c1.name} has a higher vulnerability signal primarily due to its ${c1.floodHazardLevel.toLowerCase()} flood exposure and ${c1.waterAccessPct}% tap water deficit.`;
    }
    // SCENARIO D: General or Scoring Formula Query
    else {
      answer = `### 🔍 Aqua-Lens Water & Sanitation Intelligence Overview\n\n` +
        `Aqua-Lens currently monitors **${allCommunities.length} priority settlements** across Tamil Nadu, India.\n\n` +
        `#### 🧮 Official 6-Factor Vulnerability Scoring Formula:\n` +
        `- **Water Access Gap (25%):** Inverted functional tap coverage under Jal Jeevan Mission.\n` +
        `- **Sanitation Access Gap (20%):** Inverted individual household latrine coverage under Swachh Bharat Mission (Grameen).\n` +
        `- **Climate & Flood Exposure (20%):** Central Water Commission flood hazard class & IMD precipitation deviation.\n` +
        `- **Socioeconomic Deprivation (15%):** Multidimensional poverty rating documented in published NFHS-5 factsheets.\n` +
        `- **Infrastructure Fragility (10%):** Inverted TWAD Board physical asset resilience score.\n` +
        `- **Demographic Pressure (10%):** Normalized population exposure benchmarked against Census 2011.\n\n` +
        `*Try asking:* "Which communities have high flood risk and poor sanitation?" or "Why is Mandapam high risk?"`;
      matchedCommunities = allCommunities.slice(0, 4);
    }

    const matchedFormatted: CommunitySummaryMatch[] = matchedCommunities.map((c) => ({
      id: c.id,
      name: c.name,
      district: c.district,
      block: c.block,
      state: c.state,
      score: c.compositeVulnerabilityScore,
      category: c.vulnerabilityCategory,
      waterAccessPct: c.waterAccessPct,
      sanitationAccessPct: c.sanitationAccessPct,
      floodHazardLevel: c.floodHazardLevel,
      povertyRate: c.povertyRate,
      infrastructureScore: c.infrastructureScore,
      population: c.population,
      latitude: c.latitude,
      longitude: c.longitude,
      isSampleData: c.isSampleData,
    }));

    return NextResponse.json({
      success: true,
      question,
      answer,
      contextCommunityId: contextCommunity?.id || null,
      topMatches: matchedFormatted,
      matchedIds: matchedFormatted.map((m) => m.id),
      mainContributingFactors,
      evidenceConfidence,
      dataStatus: dataStatusList,
      sourceCitations: dataSources.map((s) => `${s.datasetTitle} (${s.sourceAgency})`),
      disclaimer: "All calculations are generated by the official Aqua-Lens 6-factor deterministic risk engine. Synthetic demo baselines are labelled as Illustrative/Demo.",
    });
  } catch (error: any) {
    console.error("POST /api/ask-aqua-lens error:", error);
    return NextResponse.json(
      { error: "Natural language query processing failed: " + error.message },
      { status: 500 }
    );
  }
}
