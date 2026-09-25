export interface AISynthesisResponse {
  summary: string;
  keyVulnerabilities: string[];
  contributingFactors: string[];
  dataLimitations: string[];
  suggestedFieldActions: string[];
  potentialInterventions: string[];
  sourceCitations: string[];
  isAiGenerated: boolean;
}

export async function generateCommunityIntelligenceReport(community: {
  name: string;
  block?: string | null;
  district: string;
  state?: string | null;
  country: string;
  population: number;
  waterAccessPct: number;
  sanitationAccessPct: number;
  povertyRate: number;
  floodHazardLevel: string;
  rainfallAnnualMm: number;
  infrastructureScore: number;
  compositeVulnerabilityScore: number;
  vulnerabilityCategory: string;
  dataCompletenessPct: number;
}): Promise<AISynthesisResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const prompt = `You are a Senior Water Resources and Public Health GIS Intelligence Specialist for India's AQUA-LENS platform.
Analyze this Indian settlement record using strictly public data sources (Census of India 2011, Jal Jeevan Mission, Swachh Bharat Mission Grameen, IMD, Central Water Commission, NFHS-5):
Settlement: ${community.name}, ${community.block ? community.block + " Block, " : ""}${community.district} District, ${community.state || "Tamil Nadu"}, India
Census 2011 Population: ${community.population.toLocaleString()}
Jal Jeevan Mission Tap Water Coverage: ${community.waterAccessPct}%
Swachh Bharat Mission (Grameen) IHHL Coverage: ${community.sanitationAccessPct}%
NFHS-5 Multidimensional Deprivation: ${community.povertyRate}%
CWC Flood Hazard Band: ${community.floodHazardLevel}
IMD Normal Annual Rainfall: ${community.rainfallAnnualMm} mm
TWAD Infrastructure Resilience Score: ${community.infrastructureScore}/100
Modelled Vulnerability Score: ${community.compositeVulnerabilityScore}/100 (${community.vulnerabilityCategory})
Data Completeness: ${community.dataCompletenessPct}%

Use objective, neutral language: describe "higher modelled vulnerability signal" rather than claiming water is poisoned or asserting confirmed clinical outbreaks.
Respond in valid JSON with keys:
- summary (string: 2-3 factual analytical paragraphs)
- keyVulnerabilities (array of strings)
- contributingFactors (array of strings)
- dataLimitations (array of strings)
- suggestedFieldActions (array of strings)
- potentialInterventions (array of strings)
- sourceCitations (array of strings)`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          ...parsed,
          isAiGenerated: true,
        };
      }
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to rule-based analytical engine:", err);
    }
  }

  // Deterministic, Explainable Analytical Engine Fallback for India
  const keyVulnerabilities: string[] = [];
  const contributingFactors: string[] = [];
  const dataLimitations: string[] = [];
  const suggestedFieldActions: string[] = [];
  const potentialInterventions: string[] = [];

  if (community.waterAccessPct < 50) {
    keyVulnerabilities.push(`Piped drinking water gap: Under Jal Jeevan Mission benchmarks, only ${community.waterAccessPct}% of households have functional tap connections, leaving an estimated ${Math.round(community.population * (1 - community.waterAccessPct / 100)).toLocaleString()} persons dependent on secondary groundwater or shared standposts.`);
    contributingFactors.push("High coastal salinity, seasonal groundwater depletion, and reliance on distant CWSS feeder lines.");
    potentialInterventions.push("Augmenting TWAD Combined Water Supply Scheme (CWSS) with decentralized Solar-RO Brackish Water Desalination plants.");
  }

  if (community.sanitationAccessPct < 55) {
    keyVulnerabilities.push(`Sanitation infrastructure gap: SBM-G individual household latrine (IHHL) coverage is ${community.sanitationAccessPct}%, indicating vulnerability to open defecation during high tide or monsoons.`);
    contributingFactors.push("High water table in coastal delta sand dunes hindering standard pit latrine soakage.");
    potentialInterventions.push("Constructing elevated Community Sanitary Complexes (CSC) and twin-pit pour-flush latrines under Swachh Bharat Mission (Grameen) Phase-II.");
  }

  if (["High", "Severe", "Catastrophic"].includes(community.floodHazardLevel)) {
    keyVulnerabilities.push(`Hydrological inundation exposure: Classified under CWC ${community.floodHazardLevel} flood hazard category with ${community.rainfallAnnualMm}mm normal annual precipitation.`);
    contributingFactors.push("Vulnerability to cyclonic storm surges and riverine overtopping (e.g. Northeast Monsoon cyclonic depressions in the Bay of Bengal).");
    potentialInterventions.push("Constructing elevated RCC wellhead aprons and bio-drainage bunds to safeguard drinking water sources from storm surge inundation.");
  }

  if (community.infrastructureScore < 50) {
    keyVulnerabilities.push(`Physical asset fragility: TWAD/Panchayat water infrastructure resilience index is ${community.infrastructureScore}/100.`);
    contributingFactors.push("Corroded distribution valves, high motor burn-out rates from grid voltage fluctuations, and lack of localized spare part inventories.");
    potentialInterventions.push("Refurbishing Overhead Tank (OHT) pump machinery and equipping Gram Panchayat Village Water & Sanitation Committees (VWSC).");
  }

  dataLimitations.push(`Demographic indicators benchmarked against Census of India 2011 (${community.population.toLocaleString()} persons). Post-2011 growth is not captured in decennial tables.`);
  dataLimitations.push("Water and sanitation indicators reflect administrative program records (JJM/SBM-G) and illustrative modelled estimates; on-ground telemetry verification is recommended.");
  suggestedFieldActions.push("Conduct Jal Mitra Field Testing Kit (FTK) chemical and bacteriological water quality audit for TDS, Fluoride, and E. coli.");
  suggestedFieldActions.push("Inspect Overhead Tank (OHT) chlorination and physical integrity of distribution pipeline valves.");

  const summary = `${community.name} is a settlement of ${community.population.toLocaleString()} persons (Census 2011 baseline) located in ${community.district} District, ${community.state || "Tamil Nadu"}, India. ` +
    `It exhibits a composite vulnerability signal of ${community.compositeVulnerabilityScore}/100 (${community.vulnerabilityCategory}). ` +
    `Reported tap water coverage under Jal Jeevan Mission is ${community.waterAccessPct}%, and SBM-G sanitation coverage is ${community.sanitationAccessPct}%. ` +
    `Given its ${community.floodHazardLevel.toLowerCase()} hydrological hazard classification and NFHS-5 multidimensional deprivation rating (${community.povertyRate}%), ` +
    `prioritized public works under state and central water missions are recommended to enhance resilience against climate and salinity shocks.`;

  return {
    summary,
    keyVulnerabilities,
    contributingFactors,
    dataLimitations,
    suggestedFieldActions,
    potentialInterventions,
    sourceCitations: [
      "Jal Jeevan Mission (JJM) / WQMIS — Ministry of Jal Shakti, Government of India",
      "Office of the Registrar General & Census Commissioner, India (Census 2011)",
      "Swachh Bharat Mission (Grameen) — Open Government Data Platform India (data.gov.in)",
      "India Meteorological Department (IMD) — Precipitation Climatology",
      "Central Water Commission (CWC) — Hydrological Flood Hazard Atlas",
      "National Family Health Survey (NFHS-5) — IIPS / Ministry of Health and Family Welfare",
      "Tamil Nadu Water Supply and Drainage Board (TWAD) Asset Inventory"
    ],
    isAiGenerated: false,
  };
}

export interface ParsedNLQuery {
  filterType: "water_deficit" | "flood_exposed" | "incomplete_data" | "high_vulnerability" | "all";
  description: string;
  minVulnerabilityScore?: number;
  maxWaterAccess?: number;
  floodHazardOnly?: boolean;
  minDataCompleteness?: number;
  maxDataCompleteness?: number;
  district?: string;
}

export function parseNaturalLanguageQuery(query: string): ParsedNLQuery {
  const q = query.toLowerCase();

  // Extract district if mentioned
  let targetDistrict: string | undefined;
  if (q.includes("ramanathapuram") || q.includes("ramnad")) targetDistrict = "Ramanathapuram";
  else if (q.includes("cuddalore")) targetDistrict = "Cuddalore";
  else if (q.includes("nagapattinam")) targetDistrict = "Nagapattinam";
  else if (q.includes("mayiladuthurai")) targetDistrict = "Mayiladuthurai";
  else if (q.includes("dharmapuri")) targetDistrict = "Dharmapuri";
  else if (q.includes("tiruvannamalai")) targetDistrict = "Tiruvannamalai";

  // Water deficit
  if (q.includes("lowest water") || q.includes("tap water") || q.includes("water access") || q.includes("water deficit") || q.includes("jjm")) {
    return {
      filterType: "water_deficit",
      description: targetDistrict
        ? `Settlements in ${targetDistrict} with tap water access deficit (< 50% coverage)`
        : "Indian settlements with significant drinking water access gaps (< 50% tap coverage)",
      maxWaterAccess: 50,
      district: targetDistrict,
    };
  }

  // Flood & Cyclone
  if (q.includes("flood") || q.includes("cyclone") || q.includes("inundation") || q.includes("rainfall") || q.includes("cwc")) {
    return {
      filterType: "flood_exposed",
      description: targetDistrict
        ? `Settlements in ${targetDistrict} exposed to CWC hydrological inundation hazard`
        : "Settlements exposed to High or Severe CWC hydrological inundation hazard",
      floodHazardOnly: true,
      district: targetDistrict,
    };
  }

  // Incomplete / Audit required
  if (q.includes("incomplete") || q.includes("missing data") || q.includes("field verification") || q.includes("audit") || q.includes("unverified")) {
    return {
      filterType: "incomplete_data",
      description: "Settlements with incomplete observation records (< 75% completeness)",
      maxDataCompleteness: 75,
      district: targetDistrict,
    };
  }

  // High vulnerability
  if (q.includes("high vulnerability") || q.includes("urgent") || q.includes("critical") || q.includes("worst") || q.includes("priority")) {
    return {
      filterType: "high_vulnerability",
      description: "Settlements exhibiting high modelled vulnerability signals (Score ≥ 60)",
      minVulnerabilityScore: 60,
      district: targetDistrict,
    };
  }

  if (targetDistrict) {
    return {
      filterType: "all",
      description: `Settlements located in ${targetDistrict} District, Tamil Nadu`,
      district: targetDistrict,
    };
  }

  return {
    filterType: "all",
    description: "Displaying registered Indian settlements across the active observatory",
  };
}
