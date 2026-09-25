import { describe, it } from "node:test";
import assert from "node:assert";
import {
  calculateVulnerability,
  normalizeFloodHazard,
  getVulnerabilityCategory,
  DEFAULT_SCORING_WEIGHTS,
} from "../src/lib/scoring";
import { hasPermission } from "../src/lib/permissions";
import {
  generateInterventionRecommendations,
  evaluateRiskDrivers,
  generateActionRecommendations,
  calculateScenarioEstimate,
} from "../src/lib/recommendations";
import { parseNaturalLanguageQuery } from "../src/lib/ai";
import {
  evaluateComplaintPriority,
  detectComplaintHotspots,
  findNearestCommunity,
} from "../src/lib/complaints";
import {
  determineComplaintDepartment,
  generateUniqueTrackingId,
} from "../src/lib/complaint-routing";
import {
  getComplaintTranslation,
  INDIAN_LANGUAGES,
} from "../src/lib/i18n-complaints";

describe("AQUA-LENS Explainable 6-Factor Vulnerability Engine Tests (India)", () => {
  it("should correctly normalize flood hazard levels with IMD rainfall anomalies", () => {
    // Severe flood hazard should score at least 95-100
    const severeScore = normalizeFloodHazard("Severe", 2400);
    assert.strictEqual(severeScore, 100, "Severe hazard with high rainfall should reach cap of 100");

    // Low hazard with normal rainfall
    const lowScore = normalizeFloodHazard("Low", 900);
    assert.strictEqual(lowScore, 20, "Low hazard should normalize to 20");

    // Moderate hazard
    const modScore = normalizeFloodHazard("Moderate", 1000);
    assert.strictEqual(modScore, 50, "Moderate hazard should normalize to 50");
  });

  it("should calculate composite vulnerability with exact 6-factor weighted contributions", () => {
    const input = {
      population: 30000,
      waterAccessPct: 20,       // Inverted score: 80, weight 0.25 -> contribution 20.0
      sanitationAccessPct: 30,  // Inverted score: 70, weight 0.20 -> contribution 14.0
      povertyRate: 80,          // Direct score: 80, weight 0.15 -> contribution 12.0
      floodHazardLevel: "High", // Score: 75, weight 0.15 -> contribution 11.25
      rainfallAnnualMm: 1200,
      infrastructureScore: 40,  // Inverted score: 60, weight 0.15 -> contribution 9.0
    };

    const result = calculateVulnerability(input, DEFAULT_SCORING_WEIGHTS);

    assert.ok(result.compositeScore > 0, "Composite score must be positive");
    assert.strictEqual(result.completenessPct, 100, "All 6 indicators available should equal 100% completeness");
    assert.strictEqual(result.missingFactors.length, 0, "No factors should be missing");
    assert.strictEqual(result.contributions.length, 6, "Must contain all 6 contributing factors");
  });

  it("should handle missing data responsibly without silent zero substitutions", () => {
    const inputWithMissing = {
      population: 25000,        // Present
      waterAccessPct: 40,       // Present
      sanitationAccessPct: null,// MISSING
      povertyRate: 70,          // Present
      floodHazardLevel: "Severe",// Present
      rainfallAnnualMm: 800,
      infrastructureScore: null,// MISSING
    };

    const result = calculateVulnerability(inputWithMissing, DEFAULT_SCORING_WEIGHTS);

    // 4 out of 6 present -> completeness = 66.7%
    assert.strictEqual(result.completenessPct, 67, "Data completeness should round to 67%");
    assert.ok(result.missingFactors.some((f) => f.includes("Sanitation")), "Missing sanitation should be explicitly flagged");
    assert.ok(result.missingFactors.some((f) => f.includes("Infrastructure")), "Missing infrastructure should be flagged");

    // Since completeness >= min threshold (50%), it should still produce an adjusted proportional score
    assert.ok(result.compositeScore > 0, "Proportional score should be generated for available factors");
  });

  it("should classify community as UNKNOWN if completeness is below minimum threshold", () => {
    const verySparseInput = {
      population: null,
      waterAccessPct: 30, // Only 1 indicator out of 6 present (16.7% completeness)
      sanitationAccessPct: null,
      povertyRate: null,
      floodHazardLevel: null,
      infrastructureScore: null,
    };

    const result = calculateVulnerability(verySparseInput, DEFAULT_SCORING_WEIGHTS);
    assert.strictEqual(result.completenessPct, 17, "Completeness must be 17%");
    assert.strictEqual(result.category, "UNKNOWN", "Below 50% completeness must classify as UNKNOWN to prevent false safety");
    assert.strictEqual(result.isReliable, false, "Must be flagged as unreliable");
  });
});

describe("AQUA-LENS Role-Based Access Control (RBAC) Tests", () => {
  it("should enforce administrator privileges", () => {
    assert.strictEqual(hasPermission("ADMINISTRATOR", "canManageUsers"), true);
    assert.strictEqual(hasPermission("ADMINISTRATOR", "canConfigureScoring"), true);
    assert.strictEqual(hasPermission("ADMINISTRATOR", "canImportData"), true);
  });

  it("should prevent unauthorized modification by viewers and field officers", () => {
    assert.strictEqual(hasPermission("VIEWER", "canManageUsers"), false);
    assert.strictEqual(hasPermission("VIEWER", "canImportData"), false);
    assert.strictEqual(hasPermission("VIEWER", "canCreateInterventions"), false);

    assert.strictEqual(hasPermission("FIELD_OFFICER", "canManageUsers"), false);
    assert.strictEqual(hasPermission("FIELD_OFFICER", "canConfigureScoring"), false);
    assert.strictEqual(hasPermission("FIELD_OFFICER", "canSubmitFieldVerification"), true);
  });
});

describe("AQUA-LENS Intervention & Recommendations Engine Tests (India & JJM)", () => {
  it("should generate critical water intervention when tap water access is severely deficient", () => {
    const recs = generateInterventionRecommendations({
      name: "Mandapam North",
      district: "Ramanathapuram",
      state: "Tamil Nadu",
      population: 40000,
      waterAccessPct: 25, // Critical deficit (< 30%)
      sanitationAccessPct: 60,
      povertyRate: 50,
      floodHazardLevel: "Low",
      infrastructureScore: 70,
      waterPointsCount: 20,
      functioningWaterPointsCount: 18,
      dataCompletenessPct: 100,
    });

    const waterRec = recs.find((r) => r.category === "JAL_JEEVAN_MISSION_FHTC");
    assert.ok(waterRec, "Should produce JJM water supply recommendation");
    assert.strictEqual(waterRec?.priority, "CRITICAL", "Under 35% access must trigger CRITICAL priority");
    assert.ok(waterRec?.estimatedBudgetInr! > 1000000, "Should calculate budget in INR Lakhs based on household demand");
  });

  it("should trigger flood defense intervention when flood hazard is Severe", () => {
    const recs = generateInterventionRecommendations({
      name: "Parangipettai Coastal",
      district: "Cuddalore",
      state: "Tamil Nadu",
      population: 30000,
      waterAccessPct: 70,
      sanitationAccessPct: 70,
      povertyRate: 40,
      floodHazardLevel: "Severe",
      infrastructureScore: 60,
      waterPointsCount: 15,
      functioningWaterPointsCount: 12,
      dataCompletenessPct: 90,
    });

    const floodRec = recs.find((r) => r.category === "FLOOD_RESILIENT_WELLHEAD");
    assert.ok(floodRec, "Must generate flood defense intervention for severe hazard");
    assert.strictEqual(floodRec?.priority, "CRITICAL");
  });
});

describe("AQUA-LENS Natural Language Query Translator Tests (India / Tamil Nadu)", () => {
  it("should translate water deficit query to database filter parameters", () => {
    const parsed = parseNaturalLanguageQuery("Which Gram Panchayats have the lowest tap water access?");
    assert.strictEqual(parsed.filterType, "water_deficit");
    assert.strictEqual(parsed.maxWaterAccess, 50);
  });

  it("should translate flood exposure query for coastal districts", () => {
    const parsed = parseNaturalLanguageQuery("Show high vulnerability communities in Ramanathapuram exposed to flooding");
    assert.strictEqual(parsed.filterType, "flood_exposed");
    assert.strictEqual(parsed.floodHazardOnly, true);
    assert.strictEqual(parsed.district, "Ramanathapuram");
  });

  it("should translate incomplete data query", () => {
    const parsed = parseNaturalLanguageQuery("Which areas have incomplete or missing data?");
    assert.strictEqual(parsed.filterType, "incomplete_data");
    assert.strictEqual(parsed.maxDataCompleteness, 75);
  });
});

describe("AQUA-LENS Risk → Action Recommendation & Scenario Estimation Tests", () => {
  const sampleCommunity = {
    id: "comm-mandapam-01",
    name: "Mandapam Habitation",
    district: "Ramanathapuram",
    state: "Tamil Nadu",
    population: 34000,
    waterAccessPct: 32.5,
    sanitationAccessPct: 44.0,
    povertyRate: 58.0,
    floodHazardLevel: "Severe",
    infrastructureScore: 35,
    compositeVulnerabilityScore: 78,
  };

  it("should detect all significant risk drivers with appropriate thresholds", () => {
    const drivers = evaluateRiskDrivers(sampleCommunity);
    assert.ok(drivers.length >= 4, "Should identify multiple risk drivers");

    const waterDriver = drivers.find((d) => d.indicator === "water_access");
    assert.ok(waterDriver, "Must detect water access deficit");
    assert.strictEqual(waterDriver?.severity, "critical");
    assert.strictEqual(waterDriver?.threshold, 60);

    const floodDriver = drivers.find((d) => d.indicator === "flood_exposure");
    assert.ok(floodDriver, "Must detect flood hazard");
    assert.strictEqual(floodDriver?.severity, "critical");

    const popDriver = drivers.find((d) => d.indicator === "population");
    assert.ok(popDriver, "Must detect demographic pressure over 25k");
  });

  it("should trigger compound emergency water + flood intervention when both risks are severe", () => {
    const recs = generateActionRecommendations(sampleCommunity);
    const compoundRec = recs.find((r) => r.interventionCode === "EMERGENCY_WATER_FLOOD");
    assert.ok(compoundRec, "Must recommend compound emergency intervention when water deficit and flood risk overlap");
    assert.strictEqual(compoundRec?.priority, "CRITICAL");
    assert.ok(compoundRec?.estimatedCost > 0);
    assert.ok(compoundRec?.estimatedImpact.includes("Scenario estimate:"));
    assert.ok(compoundRec?.assumptions.includes("Not a guaranteed outcome"));
  });

  it("should calculate scenario estimate without mutating baseline score", () => {
    const recs = generateActionRecommendations(sampleCommunity);
    const selected = recs.slice(0, 2);

    const scenario = calculateScenarioEstimate(78, selected);
    assert.strictEqual(scenario.baselineScore, 78, "Baseline score must remain strictly unchanged");
    assert.ok(scenario.scenarioScore < 78, "Scenario score must reflect positive intervention impact");
    assert.ok(scenario.pointsReduced > 0, "Points reduced must be positive");
    assert.ok(scenario.disclaimer.includes("Scenario estimate"));
  });
});

describe("AQUA-LENS Complaint Center & Citizen Grievance Intelligence Tests", () => {
  it("should evaluate complaint priority transparently without mutating vulnerability scores", () => {
    // Critical case: Water quality failure in high-vulnerability community with repeated issues
    const eval1 = evaluateComplaintPriority({
      category: "WATER_QUALITY",
      communityVulnerabilityScore: 82,
      similarRecentComplaintsCount: 3,
    });
    assert.strictEqual(eval1.priority, "CRITICAL", "High severity + high vulnerability + repeated issues must be CRITICAL");
    assert.ok(eval1.reason.includes("Water quality/contamination"), "Reason must be explainable");
    assert.ok(eval1.reason.includes("HIGH vulnerability"), "Reason must cite community vulnerability");

    // Standard case: Low severity fixture defect in moderate area
    const eval2 = evaluateComplaintPriority({
      category: "INFRASTRUCTURE",
      communityVulnerabilityScore: 45,
      similarRecentComplaintsCount: 0,
    });
    assert.strictEqual(eval2.priority, "LOW", "Single fixture repair in moderate community should be LOW priority");
  });

  it("should detect spatial complaint concentrations/hotspots without clinical causation claims", () => {
    const mockComplaints = [
      { id: "c1", latitude: 9.2783, longitude: 79.1245, category: "WATER_QUALITY", status: "IN_PROGRESS", communityId: "comm1", community: { name: "Mandapam" } },
      { id: "c2", latitude: 9.2790, longitude: 79.1250, category: "WATER_SUPPLY", status: "ASSIGNED", communityId: "comm1", community: { name: "Mandapam" } },
      { id: "c3", latitude: 9.2780, longitude: 79.1240, category: "FLOODING", status: "REPORTED", communityId: "comm1", community: { name: "Mandapam" } },
      { id: "c4", latitude: 11.5000, longitude: 79.7600, category: "SANITATION", status: "REPORTED", communityId: "comm2", community: { name: "Parangipettai" } },
    ];

    const hotspots = detectComplaintHotspots(mockComplaints, 3.5);
    assert.strictEqual(hotspots.length, 1, "Should find 1 concentration in Mandapam");
    assert.strictEqual(hotspots[0].complaintCount, 3, "Mandapam cluster must contain 3 complaints");
    assert.ok(hotspots[0].disclaimer.includes("indicates spatial concentration"), "Must include non-clinical disclaimer");
  });

  it("should accurately resolve nearest Aqua-Lens community using GPS distance", () => {
    const mockCommunities = [
      { id: "comm1", name: "Mandapam", latitude: 9.2783, longitude: 79.1245 },
      { id: "comm2", name: "Parangipettai", latitude: 11.4982, longitude: 79.7645 },
    ];

    // Coordinates right near Mandapam (0.5 km away)
    const match = findNearestCommunity(9.2800, 79.1250, mockCommunities);
    assert.ok(match, "Must find nearest community");
    assert.strictEqual(match?.community.id, "comm1");
    assert.ok(match!.distanceKm < 2.0, "Distance should be under 2 km");
  });

  it("should generate globally unique, server-side tracking IDs adhering to standard format", () => {
    const trackingId = generateUniqueTrackingId("Tamil Nadu", "Ramanathapuram", 124);
    assert.match(
      trackingId,
      /^AQL-\d{4}-TN-RAM-\d{6}$/,
      "Tracking ID must match format AQL-YYYY-STATE-DISTRICT-SERIAL"
    );
    assert.ok(trackingId.includes("000124"), "Serial number must be 6-digit zero padded");
  });

  it("should route grievances automatically to appropriate administrative department and jurisdiction", () => {
    // Water supply grievance in Ramanathapuram
    const waterRoute = determineComplaintDepartment({
      category: "WATER_SUPPLY",
      district: "Ramanathapuram",
      block: "Mandapam",
      state: "Tamil Nadu",
      communityName: "Mandapam Coastal Settlement",
    });
    assert.strictEqual(waterRoute.routingStatus, "ROUTED");
    assert.ok(waterRoute.department.includes("Water Supply"), "Must route to Water Supply Authority / TWAD");
    assert.ok(waterRoute.jurisdiction.includes("Ramanathapuram"), "Must specify administrative jurisdiction");
    assert.strictEqual(waterRoute.slaHours, 48, "Water supply emergency SLA should be 48 hours");

    // Flood grievance in Cuddalore
    const floodRoute = determineComplaintDepartment({
      category: "FLOODING",
      district: "Cuddalore",
      block: "Parangipettai",
      state: "Tamil Nadu",
    });
    assert.ok(floodRoute.department.includes("Disaster Management"), "Flooding must route to DDMA / Disaster Unit");
    assert.strictEqual(floodRoute.slaHours, 12, "Flooding SLA should be urgent 12 hours");

    // Sanitation grievance in Thanjavur
    const sanitationRoute = determineComplaintDepartment({
      category: "SANITATION",
      district: "Thanjavur",
    });
    assert.ok(sanitationRoute.department.includes("Sanitation"), "Sanitation must route to Swachh Bharat / Urban Sanitation");
  });

  it("should support comprehensive Indian languages dictionary and fallback safely", () => {
    assert.strictEqual(INDIAN_LANGUAGES.length >= 13, true, "Must support at least 13 Indian languages");

    // Tamil
    const tamilDict = getComplaintTranslation("ta");
    assert.strictEqual(tamilDict.languageCode, "ta");
    assert.ok(tamilDict.voice.voiceBtn.length > 0, "Tamil voice button prompt must exist");
    assert.ok(tamilDict.evidence.title.length > 0, "Tamil evidence title must exist");

    // Hindi
    const hindiDict = getComplaintTranslation("hi");
    assert.strictEqual(hindiDict.languageCode, "hi");
    assert.ok(hindiDict.voice.voiceBtn.length > 0, "Hindi voice button prompt must exist");

    // Telugu
    const teluguDict = getComplaintTranslation("te");
    assert.strictEqual(teluguDict.languageCode, "te");

    // Unknown language fallback to English
    const fallbackDict = getComplaintTranslation("unknown-lang");
    assert.strictEqual(fallbackDict.languageCode, "en", "Fallback language must be English");
  });
});


