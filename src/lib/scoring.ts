export interface ScoringWeights {
  waterWeight: number;          // Water Access Gap (default 0.25)
  sanitationWeight: number;     // Sanitation Access Gap (default 0.20)
  climateWeight: number;        // Rainfall & Flood Exposure (default 0.20)
  socioeconomicWeight: number;  // Socioeconomic / NFHS Deprivation (default 0.15)
  infrastructureWeight: number; // Infrastructure Gap (default 0.10)
  populationWeight: number;     // Population Vulnerability & Density (default 0.10)
  minCompletenessThreshold: number; // Minimum completeness threshold (default 50.0%)
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  waterWeight: 0.25,
  sanitationWeight: 0.20,
  climateWeight: 0.20,
  socioeconomicWeight: 0.15,
  infrastructureWeight: 0.10,
  populationWeight: 0.10,
  minCompletenessThreshold: 50.0,
};

export type VulnerabilityCategory =
  | "VERY_LOW"
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH"
  | "UNKNOWN";

export interface FactorContribution {
  factorKey: "water" | "sanitation" | "climate" | "socioeconomic" | "infrastructure" | "population";
  factorName: string;
  rawValue: number | null;
  unit: string;
  normalizedScore: number; // 0-100 (100 = highest vulnerability signal)
  weight: number;          // active normalized weight
  weightedContribution: number; // normalizedScore * weight
  isMissing: boolean;
  officialSource: string;
  referencePeriod: string;
  sourceStatus: "Official" | "Imported" | "Reported" | "Modelled" | "Demo";
  notes: string;
}

export interface ExplainableRiskFingerprint {
  compositeScore: number;
  category: VulnerabilityCategory;
  categoryLabel: string;
  categoryColor: string;
  completenessPct: number;
  isReliable: boolean;
  requiresManualReview: boolean;
  missingFactors: string[];
  contributions: FactorContribution[];
  primaryRiskDriver: string;
  neutralSummary: string;
  formulaExplanation: string;
  weightsUsed: ScoringWeights;
}

export function normalizeFloodHazard(level?: string | null, annualRainfallMm?: number | null): number {
  let baseScore = 20; // Default low
  const lvl = (level || "Low").toLowerCase();
  if (lvl.includes("severe") || lvl.includes("extreme") || lvl.includes("catastrophic")) {
    baseScore = 95;
  } else if (lvl.includes("high")) {
    baseScore = 75;
  } else if (lvl.includes("moderate") || lvl.includes("medium")) {
    baseScore = 50;
  } else if (lvl.includes("low")) {
    baseScore = 20;
  }

  // IMD rainfall factor: coastal monsoon > 1400mm increases inundation risk, arid drought < 450mm increases water stress
  if (annualRainfallMm !== undefined && annualRainfallMm !== null) {
    if (annualRainfallMm > 1500) baseScore = Math.min(100, baseScore + 10);
    else if (annualRainfallMm < 500) baseScore = Math.min(100, baseScore + 15); // Severe drought stress
  }

  return Math.round(baseScore);
}

export function getVulnerabilityCategory(score: number, completenessPct: number, minThreshold: number): {
  category: VulnerabilityCategory;
  categoryLabel: string;
  categoryColor: string;
} {
  if (completenessPct < minThreshold) {
    return {
      category: "UNKNOWN",
      categoryLabel: "Data Insufficient / Missing",
      categoryColor: "#64748b",
    };
  }
  if (score <= 20) {
    return {
      category: "VERY_LOW",
      categoryLabel: "Very Low Vulnerability Signal",
      categoryColor: "#10b981", // Emerald
    };
  }
  if (score <= 40) {
    return {
      category: "LOW",
      categoryLabel: "Low Vulnerability Signal",
      categoryColor: "#06b6d4", // Cyan
    };
  }
  if (score <= 60) {
    return {
      category: "MODERATE",
      categoryLabel: "Moderate Vulnerability Signal",
      categoryColor: "#eab308", // Amber
    };
  }
  if (score <= 80) {
    return {
      category: "HIGH",
      categoryLabel: "High Vulnerability Signal",
      categoryColor: "#f97316", // Orange
    };
  }
  return {
    category: "VERY_HIGH",
    categoryLabel: "Very High Vulnerability Signal",
    categoryColor: "#ef4444", // Red
  };
}

export interface CommunityVulnerabilityInput {
  population?: number | null;
  populationDensity?: number | null;
  waterAccessPct?: number | null;
  sanitationAccessPct?: number | null;
  povertyRate?: number | null;
  socioeconomicIndex?: number | null;
  floodHazardLevel?: string | null;
  rainfallAnnualMm?: number | null;
  infrastructureScore?: number | null;
}

export function calculateVulnerability(
  input: CommunityVulnerabilityInput,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ExplainableRiskFingerprint {
  const missingFactors: string[] = [];
  const contributions: FactorContribution[] = [];

  // 1. Water Access Gap (25% default) — Inverted JJM FHTC tap water access
  const hasWater = input.waterAccessPct !== undefined && input.waterAccessPct !== null && input.waterAccessPct >= 0;
  const rawWater = hasWater ? input.waterAccessPct! : null;
  const waterNorm = hasWater ? Math.max(0, Math.min(100, 100 - rawWater!)) : 0;
  if (!hasWater) missingFactors.push("Water Access Gap (Jal Jeevan Mission / Census)");

  // 2. Sanitation Access Gap (20% default) — Inverted SBM-G rural sanitation
  const hasSanitation = input.sanitationAccessPct !== undefined && input.sanitationAccessPct !== null && input.sanitationAccessPct >= 0;
  const rawSanitation = hasSanitation ? input.sanitationAccessPct! : null;
  const sanitationNorm = hasSanitation ? Math.max(0, Math.min(100, 100 - rawSanitation!)) : 0;
  if (!hasSanitation) missingFactors.push("Sanitation Access Gap (Swachh Bharat Mission)");

  // 3. Climate & Flood Exposure (20% default) — IMD rainfall & CWC flood hazard
  const hasClimate = !!input.floodHazardLevel || input.rainfallAnnualMm !== undefined;
  const climateNorm = normalizeFloodHazard(input.floodHazardLevel, input.rainfallAnnualMm);
  const rawClimate = input.rainfallAnnualMm ?? null;
  if (!hasClimate) missingFactors.push("Rainfall & Flood Hazard Exposure (IMD / CWC)");

  // 4. Socioeconomic Vulnerability (15% default) — NFHS-5 Deprivation / MPI
  const hasSocio = (input.povertyRate !== undefined && input.povertyRate !== null) ||
                   (input.socioeconomicIndex !== undefined && input.socioeconomicIndex !== null);
  const rawSocio = input.povertyRate ?? input.socioeconomicIndex ?? null;
  const socioNorm = hasSocio ? Math.max(0, Math.min(100, rawSocio!)) : 0;
  if (!hasSocio) missingFactors.push("Socioeconomic Deprivation (NFHS-5 / NITI Aayog)");

  // 5. Infrastructure Gap (10% default) — Inverted TWAD / State Jal Shakti resilience
  const hasInfra = input.infrastructureScore !== undefined && input.infrastructureScore !== null;
  const rawInfra = hasInfra ? input.infrastructureScore! : null;
  const infraNorm = hasInfra ? Math.max(0, Math.min(100, 100 - rawInfra!)) : 0;
  if (!hasInfra) missingFactors.push("Infrastructure Gap (TWAD / State Water Supply Board)");

  // 6. Population Vulnerability & Density (10% default) — Census 2011 population pressure
  const hasPop = input.population !== undefined && input.population !== null && input.population > 0;
  const rawPop = hasPop ? input.population! : null;
  // Normalized on a logarithmic/percentile curve where >50,000 population or high density increases response demand
  const popNorm = hasPop ? Math.min(100, Math.round((Math.log10(Math.max(100, rawPop!)) / 5.5) * 100)) : 0;
  if (!hasPop) missingFactors.push("Demographic Pressure (Census 2011)");

  // Calculate Data Completeness across 6 factors
  const totalFactors = 6;
  const availableFactors = totalFactors - missingFactors.length;
  const completenessPct = Math.round((availableFactors / totalFactors) * 100);

  // Sum active weights for available indicators to dynamically re-scale
  let activeWeightSum = 0;
  if (hasWater) activeWeightSum += weights.waterWeight;
  if (hasSanitation) activeWeightSum += weights.sanitationWeight;
  if (hasClimate) activeWeightSum += weights.climateWeight;
  if (hasSocio) activeWeightSum += weights.socioeconomicWeight;
  if (hasInfra) activeWeightSum += weights.infrastructureWeight;
  if (hasPop) activeWeightSum += weights.populationWeight;

  const weightScale = activeWeightSum > 0 ? 1 / activeWeightSum : 0;

  // 1. Water contribution
  const wWater = hasWater ? weights.waterWeight * weightScale : 0;
  const cWater = Number((waterNorm * wWater).toFixed(2));
  contributions.push({
    factorKey: "water",
    factorName: "Water Access Gap",
    rawValue: rawWater,
    unit: "% tap connection coverage",
    normalizedScore: waterNorm,
    weight: Number(wWater.toFixed(3)),
    weightedContribution: cWater,
    isMissing: !hasWater,
    officialSource: "Jal Jeevan Mission (JJM) / Census 2011",
    referencePeriod: "2024 (JJM) / 2011 (Census)",
    sourceStatus: "Modelled",
    notes: hasWater ? `Inverted from ${rawWater}% tap water connection` : "Missing registry observation",
  });

  // 2. Sanitation contribution
  const wSan = hasSanitation ? weights.sanitationWeight * weightScale : 0;
  const cSan = Number((sanitationNorm * wSan).toFixed(2));
  contributions.push({
    factorKey: "sanitation",
    factorName: "Sanitation Access Gap",
    rawValue: rawSanitation,
    unit: "% IHHL coverage",
    normalizedScore: sanitationNorm,
    weight: Number(wSan.toFixed(3)),
    weightedContribution: cSan,
    isMissing: !hasSanitation,
    officialSource: "Swachh Bharat Mission (Grameen) OGD India",
    referencePeriod: "2024",
    sourceStatus: "Modelled",
    notes: hasSanitation ? `Inverted from ${rawSanitation}% household latrine coverage` : "Missing registry observation",
  });

  // 3. Climate & Flood contribution
  const wClim = hasClimate ? weights.climateWeight * weightScale : 0;
  const cClim = Number((climateNorm * wClim).toFixed(2));
  contributions.push({
    factorKey: "climate",
    factorName: "Rainfall & Flood Exposure",
    rawValue: rawClimate,
    unit: "mm annual rainfall",
    normalizedScore: climateNorm,
    weight: Number(wClim.toFixed(3)),
    weightedContribution: cClim,
    isMissing: !hasClimate,
    officialSource: "India Meteorological Dept (IMD) / Central Water Commission (CWC)",
    referencePeriod: "Climatological Normal",
    sourceStatus: "Modelled",
    notes: `Hazard Category: ${input.floodHazardLevel || "Unrecorded"}, IMD Rainfall: ${input.rainfallAnnualMm ?? "N/A"} mm`,
  });

  // 4. Socioeconomic contribution
  const wSocio = hasSocio ? weights.socioeconomicWeight * weightScale : 0;
  const cSocio = Number((socioNorm * wSocio).toFixed(2));
  contributions.push({
    factorKey: "socioeconomic",
    factorName: "Socioeconomic Deprivation",
    rawValue: rawSocio,
    unit: "% multidimensional deprivation",
    normalizedScore: socioNorm,
    weight: Number(wSocio.toFixed(3)),
    weightedContribution: cSocio,
    isMissing: !hasSocio,
    officialSource: "National Family Health Survey (NFHS-5) / NITI Aayog MPI",
    referencePeriod: "2019-2021",
    sourceStatus: "Modelled",
    notes: hasSocio ? `NFHS-5 Multidimensional Deprivation Index: ${rawSocio}%` : "Missing registry observation",
  });

  // 5. Infrastructure contribution
  const wInfra = hasInfra ? weights.infrastructureWeight * weightScale : 0;
  const cInfra = Number((infraNorm * wInfra).toFixed(2));
  contributions.push({
    factorKey: "infrastructure",
    factorName: "Infrastructure Gap",
    rawValue: rawInfra,
    unit: "rating (0-100)",
    normalizedScore: infraNorm,
    weight: Number(wInfra.toFixed(3)),
    weightedContribution: cInfra,
    isMissing: !hasInfra,
    officialSource: "TWAD Board / State Rural Water & Sanitation Registry",
    referencePeriod: "2024",
    sourceStatus: "Modelled",
    notes: hasInfra ? `Inverted from infrastructure resilience score ${rawInfra}/100` : "Missing registry observation",
  });

  // 6. Population contribution
  const wPop = hasPop ? weights.populationWeight * weightScale : 0;
  const cPop = Number((popNorm * wPop).toFixed(2));
  contributions.push({
    factorKey: "population",
    factorName: "Demographic Pressure",
    rawValue: rawPop,
    unit: "persons (Census 2011)",
    normalizedScore: popNorm,
    weight: Number(wPop.toFixed(3)),
    weightedContribution: cPop,
    isMissing: !hasPop,
    officialSource: "Census of India 2011",
    referencePeriod: "Census 2011",
    sourceStatus: "Modelled",
    notes: hasPop ? `Census 2011 Population: ${rawPop?.toLocaleString()} persons` : "Missing registry observation",
  });

  // Calculate composite score
  const rawComposite = cWater + cSan + cClim + cSocio + cInfra + cPop;
  const compositeScore = Number(rawComposite.toFixed(1));

  const { category, categoryLabel, categoryColor } = getVulnerabilityCategory(
    compositeScore,
    completenessPct,
    weights.minCompletenessThreshold
  );

  // Identify highest contributing factor
  const sortedContributions = [...contributions].sort((a, b) => b.weightedContribution - a.weightedContribution);
  const primaryRiskDriver = sortedContributions[0]?.factorName || "Water Access Gap";

  // Neutral, non-alarmist scientific summary
  const neutralSummary = `Modelled vulnerability signal: ${compositeScore}/100 (${categoryLabel}). ` +
    `Primary contributor is ${primaryRiskDriver} (contributing +${sortedContributions[0]?.weightedContribution.toFixed(1)} points). ` +
    `Note: This metric represents a prioritized planning and resource allocation signal based on official public indicators; it does not confirm physical water contamination or clinical morbidity.`;

  const formulaExplanation =
    `Composite Vulnerability Signal = ∑ (Normalized Factor Score × Normalized Weight) for available dimensions. ` +
    `Policy Weights: Water Access Gap (${(weights.waterWeight * 100).toFixed(0)}%), ` +
    `Sanitation Gap (${(weights.sanitationWeight * 100).toFixed(0)}%), ` +
    `Rainfall & Flood (${(weights.climateWeight * 100).toFixed(0)}%), ` +
    `Socioeconomic (${(weights.socioeconomicWeight * 100).toFixed(0)}%), ` +
    `Infrastructure (${(weights.infrastructureWeight * 100).toFixed(0)}%), ` +
    `Demographic Pressure (${(weights.populationWeight * 100).toFixed(0)}%). ` +
    `Calculated over ${availableFactors}/6 indicators (${completenessPct}% completeness).`;

  return {
    compositeScore,
    category,
    categoryLabel,
    categoryColor,
    completenessPct,
    isReliable: completenessPct >= weights.minCompletenessThreshold,
    requiresManualReview: completenessPct < weights.minCompletenessThreshold || missingFactors.length > 1,
    missingFactors,
    contributions,
    primaryRiskDriver,
    neutralSummary,
    formulaExplanation,
    weightsUsed: weights,
  };
}
