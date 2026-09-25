/**
 * AQUA-LENS Risk → Action Recommendation Engine
 * 
 * Translates detected risk drivers into structured, explainable intervention recommendations
 * with transparent rules, assumptions, and scenario impact estimates.
 * 
 * IMPORTANT: All impacts are explicitly labelled as Scenario Estimates based on configured
 * assumptions, NOT guaranteed real-world predictions.
 */

export interface RiskDriver {
  indicator: "water_access" | "sanitation_access" | "flood_exposure" | "infrastructure" | "socioeconomic" | "population";
  indicatorLabel: string;
  severity: "critical" | "high" | "moderate" | "low";
  value: number | string;
  unit: string;
  threshold: number | string;
  thresholdLabel: string;
  riskScore: number; // 0-100 normalized risk contribution
  description: string;
}

export interface ActionRecommendation {
  id: string;
  interventionCode: string;
  interventionName: string;
  reason: string;
  affectedIndicator: string;
  currentIndicatorValue: number | string;
  unit: string;
  threshold: number | string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  estimatedCost: number; // in INR (₹)
  estimatedCostFormatted: string;
  estimatedImpact: string;
  assumptions: string;
  confidence: "High" | "Medium" | "Low";
  targetHouseholds: number;
  suggestedAuthority: string;
  scenarioDeltaPoints: number; // Estimated reduction in composite score (Scenario Estimate)
  category: "WATER_SUPPLY" | "SANITATION_FACILITY" | "FLOOD_DEFENSE" | "INFRASTRUCTURE_REPAIR" | "SOCIOECONOMIC_AID" | "COMPOUND_EMERGENCY";
}

export interface CommunityRiskActionProfile {
  communityId: string;
  communityName: string;
  district: string;
  state: string;
  baselineVulnerabilityScore: number;
  vulnerabilityCategory: string;
  riskDrivers: RiskDriver[];
  recommendations: ActionRecommendation[];
  disclaimer: string;
}

export interface CommunityMetricInput {
  id?: string;
  name: string;
  district: string;
  state?: string;
  population: number;
  waterAccessPct: number;
  sanitationAccessPct: number;
  povertyRate: number;
  floodHazardLevel: string;
  infrastructureScore: number;
  waterPointsCount?: number;
  functioningWaterPointsCount?: number;
  dataCompletenessPct?: number;
  rainfallAnnualMm?: number;
  compositeVulnerabilityScore?: number;
  vulnerabilityCategory?: string;
}

/**
 * 1. Risk Factor Detection Layer
 * Inspects community indicators against standard Indian WASH policy thresholds.
 */
export function evaluateRiskDrivers(community: CommunityMetricInput): RiskDriver[] {
  const drivers: RiskDriver[] = [];

  // 1. Water Access Gap (Threshold: 60% JJM tap water coverage)
  const waterAccess = community.waterAccessPct ?? 0;
  if (waterAccess < 60) {
    const riskScore = Math.max(0, Math.min(100, Math.round(100 - waterAccess)));
    const severity = waterAccess < 35 ? "critical" : waterAccess < 50 ? "high" : "moderate";
    drivers.push({
      indicator: "water_access",
      indicatorLabel: "Water Access Deficit",
      severity,
      value: waterAccess,
      unit: "% tap connections",
      threshold: 60,
      thresholdLabel: "≥ 60% coverage benchmark (Jal Jeevan Mission)",
      riskScore,
      description: `Only ${waterAccess}% of households have functional piped tap connections, creating dependency on secondary unimproved or saline sources.`,
    });
  }

  // 2. Sanitation Access Gap (Threshold: 60% SBM-G coverage)
  const sanAccess = community.sanitationAccessPct ?? 0;
  if (sanAccess < 60) {
    const riskScore = Math.max(0, Math.min(100, Math.round(100 - sanAccess)));
    const severity = sanAccess < 40 ? "critical" : sanAccess < 52 ? "high" : "moderate";
    drivers.push({
      indicator: "sanitation_access",
      indicatorLabel: "Sanitation Coverage Gap",
      severity,
      value: sanAccess,
      unit: "% IHHL coverage",
      threshold: 60,
      thresholdLabel: "≥ 60% IHHL benchmark (Swachh Bharat Mission)",
      riskScore,
      description: `Household sanitation is at ${sanAccess}%, indicating risk of open defecation or uncontained fecal sludge discharge during high monsoon saturation.`,
    });
  }

  // 3. Flood & Cyclonic Inundation Hazard (Threshold: Moderate / CWC Level)
  const floodLevel = community.floodHazardLevel || "Low";
  const isHighFlood = ["High", "Severe", "Catastrophic"].includes(floodLevel);
  if (isHighFlood || floodLevel === "Moderate") {
    const riskScore = floodLevel === "Severe" || floodLevel === "Catastrophic" ? 90 : floodLevel === "High" ? 75 : 50;
    drivers.push({
      indicator: "flood_exposure",
      indicatorLabel: "Flood & Surge Inundation Hazard",
      severity: isHighFlood ? (floodLevel === "Severe" ? "critical" : "high") : "moderate",
      value: floodLevel,
      unit: "CWC hazard class",
      threshold: "Moderate",
      thresholdLabel: "Low hazard baseline (Central Water Commission)",
      riskScore,
      description: `Classified under CWC ${floodLevel} flood hazard zone, subject to cyclonic storm surges and riverine backflow.`,
    });
  }

  // 4. Infrastructure Fragility (Threshold: 50% TWAD Board Resilience Score)
  const infraScore = community.infrastructureScore ?? 50;
  if (infraScore < 50) {
    const riskScore = Math.max(0, Math.min(100, Math.round(100 - infraScore)));
    drivers.push({
      indicator: "infrastructure",
      indicatorLabel: "Infrastructure Fragility & Disrepair",
      severity: infraScore < 35 ? "critical" : "high",
      value: infraScore,
      unit: "/100 resilience score",
      threshold: 50,
      thresholdLabel: "≥ 50/100 minimum asset resilience (TWAD)",
      riskScore,
      description: `Physical infrastructure resilience is rated at ${infraScore}/100, with reported valve corrosion, pump outages, or storage tank cracks.`,
    });
  }

  // 5. Socioeconomic Deprivation (Threshold: 50% NFHS-5 Multidimensional Deprivation)
  const poverty = community.povertyRate ?? 0;
  if (poverty >= 50) {
    drivers.push({
      indicator: "socioeconomic",
      indicatorLabel: "Socioeconomic Deprivation",
      severity: poverty >= 65 ? "critical" : "high",
      value: poverty,
      unit: "% deprivation index",
      threshold: 50,
      thresholdLabel: "≤ 50% deprivation ceiling (NFHS-5 / NITI Aayog)",
      riskScore: Math.min(100, Math.round(poverty)),
      description: `NFHS-5 multidimensional deprivation rate is ${poverty}%, limiting household economic ability to self-finance private borewells or filtration.`,
    });
  }

  // 6. Demographic Pressure / Density (Threshold: > 25,000 population)
  const pop = community.population ?? 0;
  if (pop > 25000) {
    drivers.push({
      indicator: "population",
      indicatorLabel: "Demographic Volume Exposure",
      severity: pop > 35000 ? "high" : "moderate",
      value: pop.toLocaleString(),
      unit: "persons (Census 2011)",
      threshold: "25,000",
      thresholdLabel: "< 25,000 persons baseline community capacity",
      riskScore: Math.min(100, Math.round((pop / 50000) * 100)),
      description: `Census 2011 baseline of ${pop.toLocaleString()} persons exerts elevated volumetric demand on existing water sources.`,
    });
  }

  // Sort by riskScore descending
  return drivers.sort((a, b) => b.riskScore - a.riskScore);
}

export interface ComplaintSignalInput {
  waterComplaints?: number;
  sanitationComplaints?: number;
  floodComplaints?: number;
  verifiedComplaints?: number;
  totalComplaints?: number;
}

/**
 * 2. Transparent Rule-Based Action Recommendation Engine
 */
export function generateActionRecommendations(
  community: CommunityMetricInput,
  complaintSignals?: ComplaintSignalInput
): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = [];
  const households = Math.max(100, Math.round((community.population || 5000) / 4.5));
  const waterAccess = community.waterAccessPct ?? 0;
  const sanAccess = community.sanitationAccessPct ?? 0;
  const floodLevel = community.floodHazardLevel || "Low";
  const infraScore = community.infrastructureScore ?? 50;
  const poverty = community.povertyRate ?? 0;
  const pop = community.population ?? 0;
  const isHighFlood = ["High", "Severe", "Catastrophic"].includes(floodLevel);

  // RULE 1: Compound Water + Flood Risk (Both Water Access Deficit & High Flood Hazard)
  if (waterAccess < 50 && isHighFlood) {
    let compoundReason = `Compound risk detected: High flood hazard (${floodLevel}) overlaps with severe drinking water deficit (${waterAccess}%). Seasonal monsoon surges flood ground-level wells causing severe bacterial and saline contamination.`;
    if (complaintSignals?.waterComplaints || complaintSignals?.floodComplaints) {
      compoundReason += ` Corroborated on-ground by active citizen grievances (${complaintSignals?.waterComplaints || 0} water, ${complaintSignals?.floodComplaints || 0} flood/drainage).`;
    }

    recommendations.push({
      id: `rec-compound-${community.id || "c1"}`,
      interventionCode: "EMERGENCY_WATER_FLOOD",
      interventionName: "Emergency Water Provision + Flood Resilient Waterheads",
      reason: compoundReason,
      affectedIndicator: "Water Access & Flood Defense",
      currentIndicatorValue: `Water: ${waterAccess}%, Flood: ${floodLevel}`,
      unit: "Composite indicator",
      threshold: "Water ≥ 60%, Flood ≤ Low",
      priority: "CRITICAL",
      estimatedCost: 3500000, // ₹35 Lakhs
      estimatedCostFormatted: "₹35,00,000",
      estimatedImpact: "Scenario estimate: combined water and climate vulnerability could decrease by approximately 24-28 points under the configured scenario assumptions.",
      assumptions: "Estimate assumes deployment of elevated RCC wellhead platforms and a 20 KLD containerized Solar-RO plant capable of operating during grid power blackouts. Not a guaranteed outcome.",
      confidence: "High",
      targetHouseholds: households,
      suggestedAuthority: "TWAD Board & Tamil Nadu State Disaster Management Authority (TNSDMA)",
      scenarioDeltaPoints: 26,
      category: "COMPOUND_EMERGENCY",
    });
  }

  // RULE 2: Water Access Gap (Below 60% threshold)
  if (waterAccess < 60) {
    const isCritical = waterAccess < 35;
    let waterReason = `Water access is ${waterAccess}%, below the configured 60% threshold. ${Math.round(community.population * (1 - waterAccess / 100)).toLocaleString()} residents lack verified piped tap connections.`;
    if (complaintSignals?.waterComplaints && complaintSignals.waterComplaints > 0) {
      waterReason += ` Corroborated on-ground by ${complaintSignals.waterComplaints} active citizen water supply grievances.`;
    }

    recommendations.push({
      id: `rec-water-${community.id || "c1"}`,
      interventionCode: "WATER_ACCESS_IMPROVEMENT",
      interventionName: "Water Access Improvement (JJM Har Ghar Jal & Solar RO)",
      reason: waterReason,
      affectedIndicator: "Water Access",
      currentIndicatorValue: waterAccess,
      unit: "% tap connection coverage",
      threshold: 60,
      priority: isCritical ? "CRITICAL" : "HIGH",
      estimatedCost: 2500000, // ₹25 Lakhs
      estimatedCostFormatted: "₹25,00,000",
      estimatedImpact: "Scenario estimate: water-access risk could decrease by approximately 18-22 points under the configured scenario assumptions.",
      assumptions: "Estimate assumes standard Jal Jeevan Mission 55 LPCD piped network expansion and 5-year O&M contract. Not a guaranteed real-world outcome.",
      confidence: "High",
      targetHouseholds: households,
      suggestedAuthority: "Tamil Nadu Water Supply and Drainage Board (TWAD) & JJM Directorate",
      scenarioDeltaPoints: 18,
      category: "WATER_SUPPLY",
    });
  }

  // RULE 3: Sanitation Infrastructure Gap (Below 60% threshold)
  if (sanAccess < 60) {
    const isCritical = sanAccess < 40;
    let sanReason = `Sanitation coverage is ${sanAccess}%, below the configured 60% threshold. Requires community sanitary complexes and twin-pit latrine subsidies.`;
    if (complaintSignals?.sanitationComplaints && complaintSignals.sanitationComplaints > 0) {
      sanReason += ` Corroborated on-ground by ${complaintSignals.sanitationComplaints} active citizen sanitation grievances.`;
    }

    recommendations.push({
      id: `rec-sanitation-${community.id || "c1"}`,
      interventionCode: "SANITATION_IMPROVEMENT",
      interventionName: "Sanitation Infrastructure Improvement (SBM-G ODF Plus Complex)",
      reason: sanReason,
      affectedIndicator: "Sanitation Access",
      currentIndicatorValue: sanAccess,
      unit: "% IHHL coverage",
      threshold: 60,
      priority: isCritical ? "CRITICAL" : "HIGH",
      estimatedCost: 1500000, // ₹15 Lakhs
      estimatedCostFormatted: "₹15,00,000",
      estimatedImpact: "Scenario estimate: sanitation access gap could decrease by approximately 14-18 points under the configured scenario assumptions.",
      assumptions: "Estimate assumes Swachh Bharat Mission (Grameen) Phase-II institutional subsidy and community sanitary complex adoption. Not a guaranteed outcome.",
      confidence: "High",
      targetHouseholds: households,
      suggestedAuthority: "District Rural Development Agency (DRDA) & Gram Panchayat",
      scenarioDeltaPoints: 15,
      category: "SANITATION_FACILITY",
    });
  }

  // RULE 4: Flood Mitigation (If High/Severe flood hazard and not already covered by compound rule alone)
  if (isHighFlood) {
    let floodReason = `Flood exposure exceeds configured threshold (${floodLevel} hazard rating). Tidal surges and river spills risk inundating key supply assets.`;
    if (complaintSignals?.floodComplaints && complaintSignals.floodComplaints > 0) {
      floodReason += ` Corroborated on-ground by ${complaintSignals.floodComplaints} active citizen flood/drainage grievances.`;
    }

    recommendations.push({
      id: `rec-flood-${community.id || "c1"}`,
      interventionCode: "FLOOD_MITIGATION",
      interventionName: "Flood Preparedness & Raised Inundation Platforms",
      reason: floodReason,
      affectedIndicator: "Flood Exposure",
      currentIndicatorValue: floodLevel,
      unit: "CWC hazard class",
      threshold: "Moderate",
      priority: floodLevel === "Severe" || floodLevel === "Catastrophic" ? "CRITICAL" : "HIGH",
      estimatedCost: 1800000, // ₹18 Lakhs
      estimatedCostFormatted: "₹18,00,000",
      estimatedImpact: "Scenario estimate: flood vulnerability exposure could decrease by approximately 15-20 points under the configured scenario assumptions.",
      assumptions: "Estimate assumes construction of raised concrete aprons and check-valve drainage culverts. Not a guaranteed outcome.",
      confidence: "High",
      targetHouseholds: households,
      suggestedAuthority: "State Disaster Management Authority (TNSDMA) & Public Works Department",
      scenarioDeltaPoints: 16,
      category: "FLOOD_DEFENSE",
    });
  }

  // RULE 5: Infrastructure Rehabilitation (Resilience Score < 50)
  if (infraScore < 50) {
    recommendations.push({
      id: `rec-infra-${community.id || "c1"}`,
      interventionCode: "INFRASTRUCTURE_REHABILITATION",
      interventionName: "Critical Infrastructure Rehabilitation & OHT Overhaul",
      reason: `Physical infrastructure condition is rated at ${infraScore}/100, failing the 50/100 operational resilience benchmark.`,
      affectedIndicator: "Infrastructure Resilience",
      currentIndicatorValue: infraScore,
      unit: "/100 score",
      threshold: 50,
      priority: infraScore < 35 ? "CRITICAL" : "HIGH",
      estimatedCost: 1200000, // ₹12 Lakhs
      estimatedCostFormatted: "₹12,00,000",
      estimatedImpact: "Scenario estimate: infrastructure resilience gap could decrease by approximately 12-16 points under the configured scenario assumptions.",
      assumptions: "Estimate is based on TWAD Board standard schedule of rates for electro-mechanical pump replacement and tank desilting. Not a guaranteed outcome.",
      confidence: "Medium",
      targetHouseholds: Math.round(households * 0.6),
      suggestedAuthority: "TWAD Board Maintenance Division & Panchayat Union Block Development Office",
      scenarioDeltaPoints: 13,
      category: "INFRASTRUCTURE_REPAIR",
    });
  }

  // RULE 6: Socioeconomic Equity Subsidies (Poverty Rate >= 50%)
  if (poverty >= 50) {
    recommendations.push({
      id: `rec-socio-${community.id || "c1"}`,
      interventionCode: "SOCIOECONOMIC_COMMUNITY_SUPPORT",
      interventionName: "Targeted Subsidized Household WASH Connection Package",
      reason: `Multidimensional deprivation index is ${poverty}%, exceeding the 50% vulnerability ceiling. High connection charges prevent poor households from accessing existing mains.`,
      affectedIndicator: "Socioeconomic Equity",
      currentIndicatorValue: poverty,
      unit: "% deprivation",
      threshold: 50,
      priority: "MEDIUM",
      estimatedCost: 1000000, // ₹10 Lakhs
      estimatedCostFormatted: "₹10,00,000",
      estimatedImpact: "Scenario estimate: socioeconomic WASH barrier score could decrease by approximately 8-12 points under the configured scenario assumptions.",
      assumptions: "Estimate assumes 100% waiving of connection fees for vulnerable households under state social welfare schemes. Not a guaranteed outcome.",
      confidence: "Medium",
      targetHouseholds: Math.round(households * 0.4),
      suggestedAuthority: "Department of Rural Development & Panchayat Raj",
      scenarioDeltaPoints: 10,
      category: "SOCIOECONOMIC_AID",
    });
  }

  // RULE 7: Population Density / Growth Pressure (Pop > 25,000)
  if (pop > 25000) {
    recommendations.push({
      id: `rec-pop-${community.id || "c1"}`,
      interventionCode: "DEMOGRAPHIC_EXPANSION",
      interventionName: "High-Capacity Dual Storage Pumping & Augmentation",
      reason: `Census 2011 population baseline of ${pop.toLocaleString()} creates intense volumetric draw on single-well sources.`,
      affectedIndicator: "Demographic Volume Exposure",
      currentIndicatorValue: pop.toLocaleString(),
      unit: "persons",
      threshold: "25,000",
      priority: "MEDIUM",
      estimatedCost: 2000000, // ₹20 Lakhs
      estimatedCostFormatted: "₹20,00,000",
      estimatedImpact: "Scenario estimate: demographic stress index could decrease by approximately 6-10 points under the configured scenario assumptions.",
      assumptions: "Estimate assumes addition of an extra 1.0 Lakh Liter Overhead Tank and booster pumping. Not a guaranteed outcome.",
      confidence: "High",
      targetHouseholds: households,
      suggestedAuthority: "TWAD Board Major Works Division",
      scenarioDeltaPoints: 8,
      category: "WATER_SUPPLY",
    });
  }

  return recommendations;
}

/**
 * 3. Scenario Simulation Helper
 * Calculates the estimated vulnerability score reduction from applying selected interventions
 * using diminishing returns so multiple interventions model real-world interaction.
 * IMPORTANT: Does NOT modify the real community score.
 */
export function calculateScenarioEstimate(
  baselineScore: number,
  selectedRecommendations: ActionRecommendation[]
): {
  baselineScore: number;
  scenarioScore: number;
  totalEstimatedCost: number;
  totalEstimatedCostFormatted: string;
  pointsReduced: number;
  estimatedReach: number;
  disclaimer: string;
} {
  let totalDelta = 0;
  let totalCost = 0;
  let totalReach = 0;

  // Apply diminishing returns formula: Delta_eff = sum(Delta_i * (0.85 ^ i))
  const sorted = [...selectedRecommendations].sort((a, b) => b.scenarioDeltaPoints - a.scenarioDeltaPoints);
  sorted.forEach((rec, idx) => {
    const factor = Math.pow(0.85, idx);
    totalDelta += rec.scenarioDeltaPoints * factor;
    totalCost += rec.estimatedCost;
    totalReach = Math.max(totalReach, rec.targetHouseholds * 4.5);
  });

  const pointsReduced = Math.min(baselineScore - 10, Math.round(totalDelta));
  const scenarioScore = Math.max(10, Math.round(baselineScore - pointsReduced));

  return {
    baselineScore,
    scenarioScore,
    totalEstimatedCost: totalCost,
    totalEstimatedCostFormatted: `₹${(totalCost / 100000).toFixed(2)} Lakhs`,
    pointsReduced,
    estimatedReach: Math.round(totalReach),
    disclaimer: "Scenario estimate — based on configured assumptions, not a guaranteed prediction. Does not modify the official community score.",
  };
}

/**
 * Backward-compatible helper for legacy test suite & existing endpoints
 */
export function generateInterventionRecommendations(community: CommunityMetricInput): any[] {
  const recs = generateActionRecommendations(community);
  return recs.map((r) => ({
    id: r.id,
    category: r.interventionCode === "WATER_ACCESS_IMPROVEMENT"
      ? "JAL_JEEVAN_MISSION_FHTC"
      : r.interventionCode === "SANITATION_IMPROVEMENT"
      ? "SBM_COMMUNITY_TOILET"
      : r.interventionCode === "FLOOD_MITIGATION"
      ? "FLOOD_RESILIENT_WELLHEAD"
      : r.interventionCode === "INFRASTRUCTURE_REHABILITATION"
      ? "TWAD_PIPELINE_REPAIR"
      : "CAPACITY_BUILDING",
    title: r.interventionName,
    rationale: r.reason,
    priority: r.priority,
    estimatedBudgetInr: r.estimatedCost,
    targetHouseholds: r.targetHouseholds,
    suggestedAuthority: r.suggestedAuthority,
    evidenceIndicators: [`Affected Indicator: ${r.affectedIndicator}`, `Current Value: ${r.currentIndicatorValue}`],
  }));
}
