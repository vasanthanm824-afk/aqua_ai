import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateVulnerability, DEFAULT_SCORING_WEIGHTS } from "./scoring";

export async function seedDatabase(customPrisma?: PrismaClient) {
  let prisma = customPrisma;
  let disconnectNeeded = false;

  if (!prisma) {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "file:./dev.db";
    }
    prisma = new PrismaClient();
    disconnectNeeded = true;
  }

  try {
    console.log("🇮🇳 Initializing AQUA-LENS India-Specific WASH Intelligence Database...");

    // 1. Clean existing records
    await prisma.complaintEvidence.deleteMany();
    await prisma.complaintStatusHistory.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.interventionRecommendation.deleteMany();
    await prisma.interventionType.deleteMany();
    await prisma.scenarioAllocation.deleteMany();
    await prisma.planningScenario.deleteMany();
    await prisma.intervention.deleteMany();
    await prisma.fieldVerification.deleteMany();
    await prisma.infrastructureAsset.deleteMany();
    await prisma.hazardEvent.deleteMany();
    await prisma.climateObservation.deleteMany();
    await prisma.vulnerabilityContribution.deleteMany();
    await prisma.vulnerabilityAssessment.deleteMany();
    await prisma.vulnerabilityConfiguration.deleteMany();
    await prisma.indicatorObservation.deleteMany();
    await prisma.indicator.deleteMany();
    await prisma.datasetRecord.deleteMany();
    await prisma.datasetImport.deleteMany();
    await prisma.dataSource.deleteMany();
    await prisma.geographicBoundary.deleteMany();
    await prisma.community.deleteMany();
    await prisma.administrativeRegion.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    // 2. Organization & Workspace for India
    const org = await prisma.organization.create({
      data: {
        name: "Tamil Nadu Water Supply and Drainage Board (TWAD) & Jal Jeevan Mission Cell",
        slug: "twad-jal-jeevan-mission",
        description: "State Environmental Intelligence & Rural Water Supply Monitoring Division, Government of Tamil Nadu, India.",
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: "Tamil Nadu Coastal & Drought-Prone Basin Observatory",
        organizationId: org.id,
        selectedState: "Tamil Nadu",
        selectedDistrict: "Ramanathapuram",
      },
    });

    // 3. Indian User Accounts
    const passwordHashAdmin = await bcrypt.hash("AquaAdmin2026!", 10);
    const passwordHashAnalyst = await bcrypt.hash("Analyst2026!", 10);
    const passwordHashOfficer = await bcrypt.hash("FieldOfficer2026!", 10);
    const passwordHashViewer = await bcrypt.hash("Viewer2026!", 10);
    const passwordHashCitizen = await bcrypt.hash("Citizen2026!", 10);

    const adminUser = await prisma.user.create({
      data: {
        email: "admin@aqualens.gov.in",
        passwordHash: passwordHashAdmin,
        name: "Dr. K. Senthil Kumar, IAS",
        role: "ADMINISTRATOR",
        organizationId: org.id,
      },
    });

    await prisma.user.create({
      data: {
        email: "admin@aqualens.org",
        passwordHash: passwordHashAdmin,
        name: "Aqua-Lens Admin",
        role: "ADMINISTRATOR",
        organizationId: org.id,
      },
    });

    const analystUser = await prisma.user.create({
      data: {
        email: "ananya.sharma@aqualens.gov.in",
        passwordHash: passwordHashAnalyst,
        name: "Ananya Sharma, GIS Lead",
        role: "ANALYST",
        organizationId: org.id,
      },
    });

    const officerUser = await prisma.user.create({
      data: {
        email: "m.subramanian@aqualens.gov.in",
        passwordHash: passwordHashOfficer,
        name: "M. Subramanian, Assistant Engineer",
        role: "FIELD_OFFICER",
        organizationId: org.id,
      },
    });

    const viewerUser = await prisma.user.create({
      data: {
        email: "citizen.observer@aqualens.org",
        passwordHash: passwordHashViewer,
        name: "Civil Society Observer (TN)",
        role: "VIEWER",
        organizationId: org.id,
      },
    });

    await prisma.user.create({
      data: {
        email: "citizen@aqualens.org",
        passwordHash: passwordHashCitizen,
        name: "Ramasamy (Citizen)",
        role: "VIEWER",
        organizationId: org.id,
      },
    });


    // 4. Standard 6-Factor Vulnerability Configuration for India
    const scoringConfig = await prisma.vulnerabilityConfiguration.create({
      data: {
        version: 1,
        name: "India National WASH Vulnerability Policy v1 (JJM-SBM Model)",
        isActive: true,
        waterWeight: 0.25,        // 25% Water access gap (JJM)
        sanitationWeight: 0.20,   // 20% Sanitation coverage gap (SBM-G)
        climateWeight: 0.20,      // 20% IMD rainfall & CWC flood hazard
        socioeconomicWeight: 0.15,// 15% NFHS-5 Multidimensional Deprivation
        infrastructureWeight: 0.10,// 10% TWAD infrastructure condition
        populationWeight: 0.10,   // 10% Census 2011 population pressure
        minCompletenessThreshold: 50.0,
        createdByUserId: adminUser.id,
      },
    });

    // 5. Official Indian Public Data Source Registry
    await prisma.dataSource.create({
      data: {
        sourceAgency: "Ministry of Jal Shakti, Government of India",
        officialUrl: "https://ejalshakti.gov.in/WQMIS",
        datasetTitle: "Jal Jeevan Mission (JJM) Har Ghar Jal & WQMIS Portal",
        indicatorName: "Functional Household Tap Connection (FHTC) & Water Quality",
        indicatorDefinition: "Percentage of rural households provided with individual piped potable tap water connections (55 LPCD standard) and verified laboratory water quality testing.",
        geographicLevel: "State / District / Block / Gram Panchayat",
        referencePeriod: "2024-2025",
        units: "% of households",
        sourceStatus: "Official",
        confidenceNote: "Official Government of India portal data. Illustrative demo values used in prototype until direct state API integration.",
        category: "WATER_ACCESS",
        lastUpdated: new Date(),
      },
    });

    await prisma.dataSource.create({
      data: {
        sourceAgency: "Office of the Registrar General & Census Commissioner, India (ORGI)",
        officialUrl: "https://censusindia.gov.in/census.website/en",
        datasetTitle: "Census of India 2011 Primary Census Abstract & Household Table H-8",
        indicatorName: "Village Population & Household Drinking Water Source Distribution",
        indicatorDefinition: "Official decennial count of village/town resident population and proportion of households with treated tap water, handpumps, and wells.",
        geographicLevel: "District / Sub-District / Village / Ward",
        referencePeriod: "Census 2011",
        units: "Count of persons / households",
        sourceStatus: "Official",
        confidenceNote: "Official Census 2011 baseline data. Clearly flagged as Census 2011 rather than current census projections.",
        category: "POPULATION",
        lastUpdated: new Date(),
      },
    });

    await prisma.dataSource.create({
      data: {
        sourceAgency: "Department of Drinking Water & Sanitation, Ministry of Jal Shakti (OGD India)",
        officialUrl: "https://www.data.gov.in/catalog/daily-data-rural-sanitation-coverage-under-swachh-bharat-mission",
        datasetTitle: "Swachh Bharat Mission (Grameen) Rural Sanitation Coverage",
        indicatorName: "Individual Household Latrine (IHHL) Coverage & ODF Plus Status",
        indicatorDefinition: "Percentage of rural households with access to sanitary individual latrines, community sanitary complexes (CSC), and solid/liquid waste management.",
        geographicLevel: "District / Block / Gram Panchayat",
        referencePeriod: "2024",
        units: "% coverage",
        sourceStatus: "Official",
        confidenceNote: "Open Government Data (OGD) catalog. Catalog records dated at time of survey.",
        category: "SANITATION",
        lastUpdated: new Date(),
      },
    });

    await prisma.dataSource.create({
      data: {
        sourceAgency: "India Meteorological Department (IMD), Ministry of Earth Sciences",
        officialUrl: "https://mausam.imd.gov.in/",
        datasetTitle: "IMD District Rainfall Climatology & Daily Gridded Precipitation",
        indicatorName: "Normal Annual Precipitation & Monsoon Rainfall Deviation",
        indicatorDefinition: "Long-period average annual precipitation (mm) and southwest/northeast monsoon departure indices.",
        geographicLevel: "District / Meteorological Sub-Division",
        referencePeriod: "1981-2020 Normal",
        units: "mm per year",
        sourceStatus: "Official",
        confidenceNote: "Official IMD meteorological normal. Real-time telemetry simulated as Modelled for demonstration.",
        category: "CLIMATE_FLOOD",
        lastUpdated: new Date(),
      },
    });

    await prisma.dataSource.create({
      data: {
        sourceAgency: "Central Water Commission (CWC) & Tamil Nadu SDMA",
        officialUrl: "https://cwc.gov.in/",
        datasetTitle: "National Hydrological River Basin Flood Atlas & Cyclone Inundation Hazard",
        indicatorName: "Hydrological Flood Hazard Level & Inundation Risk Band",
        indicatorDefinition: "Multi-year hydrological return period flood hazard categorization (Low, Moderate, High, Severe) for riverine delta and coastal surge zones.",
        geographicLevel: "Basin / District / Coastal Taluk",
        referencePeriod: "2020-2024",
        units: "Risk Classification (Low/Moderate/High/Severe)",
        sourceStatus: "Official",
        confidenceNote: "Official hydrological survey. Visual overlays generated as Modelled/Demo for demonstration.",
        category: "CLIMATE_FLOOD",
        lastUpdated: new Date(),
      },
    });

    await prisma.dataSource.create({
      data: {
        sourceAgency: "International Institute for Population Sciences (IIPS) & MoHFW, India",
        officialUrl: "https://www.data.gov.in/resource/all-india-level-and-state-wise-key-indicators-nfhs-3-and-nfhs-4",
        datasetTitle: "National Family Health Survey (NFHS-5) State & District Factsheets",
        indicatorName: "Multidimensional Deprivation & Household Standard of Living Indicators",
        indicatorDefinition: "Proportion of households deprived across housing, clean cooking fuel, sanitation, and electricity dimensions as documented in NFHS-5 / NITI Aayog MPI.",
        geographicLevel: "State / District",
        referencePeriod: "NFHS-5 (2019-2021)",
        units: "% multidimensional deprivation",
        sourceStatus: "Official",
        confidenceNote: "Official survey period 2019-2021. District-level approximations labeled as Modelled.",
        category: "SOCIOECONOMIC",
        lastUpdated: new Date(),
      },
    });

    await prisma.dataSource.create({
      data: {
        sourceAgency: "Tamil Nadu Water Supply and Drainage Board (TWAD), Govt of Tamil Nadu",
        officialUrl: "https://www.twadboard.tn.gov.in/",
        datasetTitle: "Combined Water Supply Scheme (CWSS) Asset Inventory & Deficit Log",
        indicatorName: "Physical Water Infrastructure Health & OHT Resilience Score",
        indicatorDefinition: "Physical operational condition of overhead tanks (OHT), pumping machinery, ground level reservoirs (GLR), and desalination feeder pipelines.",
        geographicLevel: "District / Block / Gram Panchayat",
        referencePeriod: "2024",
        units: "Index (0-100)",
        sourceStatus: "Official",
        confidenceNote: "State water utility asset register. Illustrative values labeled as Demo/Modelled.",
        category: "INFRASTRUCTURE",
        lastUpdated: new Date(),
      },
    });

    // 6. India-Specific Demo Settlements (Tamil Nadu)
    const indiaDemoSettlements = [
      {
        name: "Mandapam Coastal Habitation",
        code: "TN-RAM-01",
        block: "Mandapam",
        district: "Ramanathapuram",
        state: "Tamil Nadu",
        latitude: 9.2783,
        longitude: 79.1245,
        population: 18200,
        populationDensity: 420.0,
        waterAccessPct: 32.5,
        waterSourceType: "Combined Water Supply Scheme (CWSS) & RO Kiosk",
        waterServiceLevel: "Limited Piped Supply",
        sanitationAccessPct: 48.0,
        sanitationServiceType: "Individual Household Latrine (IHHL)",
        povertyRate: 54.2,
        rainfallAnnualMm: 820,
        floodHazardLevel: "Severe",
        historicalFloodEvents: 4,
        infrastructureScore: 38.0,
        waterPointsCount: 24,
        functioningWaterPointsCount: 13,
        sanitationFacilitiesCount: 6,
      },
      {
        name: "Tiruvadanai Agrarian Panchayat",
        code: "TN-RAM-02",
        block: "Tiruvadanai",
        district: "Ramanathapuram",
        state: "Tamil Nadu",
        latitude: 9.7891,
        longitude: 78.9124,
        population: 24500,
        populationDensity: 310.0,
        waterAccessPct: 38.0,
        waterSourceType: "Deep Borewell with OHT & Open Ooranis",
        waterServiceLevel: "Unimproved / High Total Dissolved Solids",
        sanitationAccessPct: 52.0,
        sanitationServiceType: "Twin-Pit Pour Flush Latrine",
        povertyRate: 58.0,
        rainfallAnnualMm: 890,
        floodHazardLevel: "High",
        historicalFloodEvents: 3,
        infrastructureScore: 42.0,
        waterPointsCount: 32,
        functioningWaterPointsCount: 19,
        sanitationFacilitiesCount: 8,
      },
      {
        name: "Mudukulathur Drought Basin",
        code: "TN-RAM-03",
        block: "Mudukulathur",
        district: "Ramanathapuram",
        state: "Tamil Nadu",
        latitude: 9.3421,
        longitude: 78.5123,
        population: 29800,
        populationDensity: 295.0,
        waterAccessPct: 29.0,
        waterSourceType: "Cauvery Integrated Pipeline Extension",
        waterServiceLevel: "Intermittent Tank Supply",
        sanitationAccessPct: 44.0,
        sanitationServiceType: "Individual Household Latrine (IHHL)",
        povertyRate: 62.5,
        rainfallAnnualMm: 740,
        floodHazardLevel: "Moderate",
        historicalFloodEvents: 1,
        infrastructureScore: 32.0,
        waterPointsCount: 38,
        functioningWaterPointsCount: 16,
        sanitationFacilitiesCount: 5,
      },
      {
        name: "Kilakarai Coastal Habitation",
        code: "TN-RAM-04",
        block: "Kilakarai",
        district: "Ramanathapuram",
        state: "Tamil Nadu",
        latitude: 9.2312,
        longitude: 78.7845,
        population: 38400,
        populationDensity: 850.0,
        waterAccessPct: 45.0,
        waterSourceType: "Desalination Plant & TWAD Piped Feed",
        waterServiceLevel: "Basic Piped Connection",
        sanitationAccessPct: 64.0,
        sanitationServiceType: "Septic Tank with Soak Pit",
        povertyRate: 41.0,
        rainfallAnnualMm: 860,
        floodHazardLevel: "Severe",
        historicalFloodEvents: 3,
        infrastructureScore: 54.0,
        waterPointsCount: 42,
        functioningWaterPointsCount: 31,
        sanitationFacilitiesCount: 14,
      },
      {
        name: "Paramakudi Riverine Cluster",
        code: "TN-RAM-05",
        block: "Paramakudi",
        district: "Ramanathapuram",
        state: "Tamil Nadu",
        latitude: 9.5432,
        longitude: 78.5912,
        population: 52000,
        populationDensity: 620.0,
        waterAccessPct: 56.0,
        waterSourceType: "Vaigai River Bed Subsurface Collector Well",
        waterServiceLevel: "Basic",
        sanitationAccessPct: 61.0,
        sanitationServiceType: "Piped Sewerage / Septic",
        povertyRate: 46.0,
        rainfallAnnualMm: 810,
        floodHazardLevel: "High",
        historicalFloodEvents: 2,
        infrastructureScore: 61.0,
        waterPointsCount: 56,
        functioningWaterPointsCount: 44,
        sanitationFacilitiesCount: 18,
      },
      {
        name: "Parangipettai Estuary Village",
        code: "TN-CUD-06",
        block: "Parangipettai",
        district: "Cuddalore",
        state: "Tamil Nadu",
        latitude: 11.4982,
        longitude: 79.7645,
        population: 32500,
        populationDensity: 690.0,
        waterAccessPct: 41.0,
        waterSourceType: "Vellar River Subsurface Infiltration Scheme",
        waterServiceLevel: "Limited / Estuary Saline Intrusion",
        sanitationAccessPct: 50.0,
        sanitationServiceType: "IHHL & Community Complex",
        povertyRate: 51.5,
        rainfallAnnualMm: 1350,
        floodHazardLevel: "Severe",
        historicalFloodEvents: 5,
        infrastructureScore: 40.0,
        waterPointsCount: 36,
        functioningWaterPointsCount: 21,
        sanitationFacilitiesCount: 9,
      },
      {
        name: "Chidambaram Rural Habitations",
        code: "TN-CUD-07",
        block: "Chidambaram",
        district: "Cuddalore",
        state: "Tamil Nadu",
        latitude: 11.3991,
        longitude: 79.6934,
        population: 46200,
        populationDensity: 740.0,
        waterAccessPct: 58.0,
        waterSourceType: "Kollidam River Deep Borewell Collector Wells",
        waterServiceLevel: "Basic Tap Water",
        sanitationAccessPct: 62.0,
        sanitationServiceType: "Pour-Flush Septic System",
        povertyRate: 45.0,
        rainfallAnnualMm: 1280,
        floodHazardLevel: "Severe",
        historicalFloodEvents: 4,
        infrastructureScore: 58.0,
        waterPointsCount: 52,
        functioningWaterPointsCount: 42,
        sanitationFacilitiesCount: 16,
      },
      {
        name: "Kurinjipadi Inland Panchayat",
        code: "TN-CUD-08",
        block: "Kurinjipadi",
        district: "Cuddalore",
        state: "Tamil Nadu",
        latitude: 11.5643,
        longitude: 79.6012,
        population: 35400,
        populationDensity: 480.0,
        waterAccessPct: 53.0,
        waterSourceType: "Cuddalore Sandstone Deep Aquifer",
        waterServiceLevel: "Basic",
        sanitationAccessPct: 58.0,
        sanitationServiceType: "Twin-Pit Latrine",
        povertyRate: 48.0,
        rainfallAnnualMm: 1150,
        floodHazardLevel: "Moderate",
        historicalFloodEvents: 2,
        infrastructureScore: 52.0,
        waterPointsCount: 40,
        functioningWaterPointsCount: 30,
        sanitationFacilitiesCount: 11,
      },
      {
        name: "Vedaranyam Salt Pan Panchayat",
        code: "TN-NAG-09",
        block: "Vedaranyam",
        district: "Nagapattinam",
        state: "Tamil Nadu",
        latitude: 10.3721,
        longitude: 79.8512,
        population: 34200,
        populationDensity: 510.0,
        waterAccessPct: 26.0,
        waterSourceType: "Deep Sand Dune Freshwater Lenses & Tankers",
        waterServiceLevel: "Unimproved / Highly Saline",
        sanitationAccessPct: 41.0,
        sanitationServiceType: "Individual Household Latrine",
        povertyRate: 64.0,
        rainfallAnnualMm: 1420,
        floodHazardLevel: "Severe",
        historicalFloodEvents: 6,
        infrastructureScore: 28.0,
        waterPointsCount: 30,
        functioningWaterPointsCount: 11,
        sanitationFacilitiesCount: 5,
      },
      {
        name: "Tharangambadi Coastal Hamlet",
        code: "TN-MAY-10",
        block: "Tharangambadi",
        district: "Mayiladuthurai",
        state: "Tamil Nadu",
        latitude: 11.0289,
        longitude: 79.8543,
        population: 27800,
        populationDensity: 650.0,
        waterAccessPct: 48.0,
        waterSourceType: "Cauvery Tail-End CWSS Pipeline",
        waterServiceLevel: "Limited",
        sanitationAccessPct: 56.0,
        sanitationServiceType: "Pour-Flush to Septic",
        povertyRate: 47.0,
        rainfallAnnualMm: 1310,
        floodHazardLevel: "Severe",
        historicalFloodEvents: 4,
        infrastructureScore: 49.0,
        waterPointsCount: 35,
        functioningWaterPointsCount: 24,
        sanitationFacilitiesCount: 10,
      },
      {
        name: "Pennagaram Fluorosis Belt",
        code: "TN-DHA-11",
        block: "Pennagaram",
        district: "Dharmapuri",
        state: "Tamil Nadu",
        latitude: 12.1342,
        longitude: 77.8921,
        population: 38900,
        populationDensity: 390.0,
        waterAccessPct: 36.0,
        waterSourceType: "Hogenakkal Drinking Water Fluorosis Mitigation Scheme",
        waterServiceLevel: "Treated Fluoride-Safe Tap Water",
        sanitationAccessPct: 49.0,
        sanitationServiceType: "IHHL Rural Latrine",
        povertyRate: 59.0,
        rainfallAnnualMm: 850,
        floodHazardLevel: "Low",
        historicalFloodEvents: 0,
        infrastructureScore: 44.0,
        waterPointsCount: 44,
        functioningWaterPointsCount: 26,
        sanitationFacilitiesCount: 9,
      },
      {
        name: "Polur Hard-Rock Habitation",
        code: "TN-TIR-12",
        block: "Polur",
        district: "Tiruvannamalai",
        state: "Tamil Nadu",
        latitude: 12.5123,
        longitude: 79.1245,
        population: 31500,
        populationDensity: 440.0,
        waterAccessPct: 42.0,
        waterSourceType: "Cheyyar River Infiltration & Borewells",
        waterServiceLevel: "Basic Tap Water",
        sanitationAccessPct: 51.0,
        sanitationServiceType: "Individual Household Latrine",
        povertyRate: 53.0,
        rainfallAnnualMm: 1020,
        floodHazardLevel: "Moderate",
        historicalFloodEvents: 1,
        infrastructureScore: 50.0,
        waterPointsCount: 39,
        functioningWaterPointsCount: 27,
        sanitationFacilitiesCount: 11,
      },
    ];

    console.log(`📍 Inserting ${indiaDemoSettlements.length} Tamil Nadu demo communities with 6-factor explainable calculation...`);

    for (const s of indiaDemoSettlements) {
      const fingerprint = calculateVulnerability(
        {
          population: s.population,
          populationDensity: s.populationDensity,
          waterAccessPct: s.waterAccessPct,
          sanitationAccessPct: s.sanitationAccessPct,
          povertyRate: s.povertyRate,
          floodHazardLevel: s.floodHazardLevel,
          rainfallAnnualMm: s.rainfallAnnualMm,
          infrastructureScore: s.infrastructureScore,
        },
        DEFAULT_SCORING_WEIGHTS
      );

      const community = await prisma.community.create({
        data: {
          name: s.name,
          code: s.code,
          block: s.block,
          district: s.district,
          state: s.state,
          country: "India",
          latitude: s.latitude,
          longitude: s.longitude,
          population: s.population,
          populationYear: 2011,
          populationDensity: s.populationDensity,
          waterAccessPct: s.waterAccessPct,
          waterSourceType: s.waterSourceType,
          waterServiceLevel: s.waterServiceLevel,
          waterDataConfidence: "Official / JJM WQMIS",
          waterReferenceYear: 2024,
          sanitationAccessPct: s.sanitationAccessPct,
          sanitationServiceType: s.sanitationServiceType,
          sanitationReferenceYear: 2024,
          povertyRate: s.povertyRate,
          socioeconomicSurveyPeriod: "NFHS-5 (2019-2021)",
          rainfallAnnualMm: s.rainfallAnnualMm,
          floodHazardLevel: s.floodHazardLevel,
          historicalFloodEvents: s.historicalFloodEvents,
          climateReferencePeriod: "IMD Climatology / CWC Atlas",
          infrastructureScore: s.infrastructureScore,
          waterPointsCount: s.waterPointsCount,
          functioningWaterPointsCount: s.functioningWaterPointsCount,
          sanitationFacilitiesCount: s.sanitationFacilitiesCount,
          infrastructureStatus: "Reported by TWAD / Gram Panchayat",
          compositeVulnerabilityScore: fingerprint.compositeScore,
          vulnerabilityCategory: fingerprint.category,
          dataCompletenessPct: fingerprint.completenessPct,
          sourceStatus: "Demo",
          isSampleData: true,
          dataLimitationsNotice: "Illustrative demo baseline — not official or live telemetry",
          status: "ACTIVE",
        },
      });

      // Save Assessment Record
      const savedAssessment = await prisma.vulnerabilityAssessment.create({
        data: {
          communityId: community.id,
          configId: scoringConfig.id,
          configVersion: 1,
          compositeScore: fingerprint.compositeScore,
          category: fingerprint.category,
          waterScore: fingerprint.contributions.find((c) => c.factorKey === "water")?.normalizedScore || 0,
          sanitationScore: fingerprint.contributions.find((c) => c.factorKey === "sanitation")?.normalizedScore || 0,
          climateScore: fingerprint.contributions.find((c) => c.factorKey === "climate")?.normalizedScore || 0,
          socioeconomicScore: fingerprint.contributions.find((c) => c.factorKey === "socioeconomic")?.normalizedScore || 0,
          infrastructureScore: fingerprint.contributions.find((c) => c.factorKey === "infrastructure")?.normalizedScore || 0,
          populationScore: fingerprint.contributions.find((c) => c.factorKey === "population")?.normalizedScore || 0,
          completenessPct: fingerprint.completenessPct,
          missingFactorsJson: JSON.stringify(fingerprint.missingFactors),
          notes: fingerprint.formulaExplanation,
        },
      });

      for (const factor of fingerprint.contributions) {
        await prisma.vulnerabilityContribution.create({
          data: {
            assessmentId: savedAssessment.id,
            factorName: factor.factorName,
            rawValue: factor.rawValue ?? 0,
            normalizedScore: factor.normalizedScore,
            weight: factor.weight,
            weightedContribution: factor.weightedContribution,
          },
        });
      }

      // Create Indian Infrastructure Assets
      await prisma.infrastructureAsset.create({
        data: {
          communityId: community.id,
          name: `${community.name} 60,000 Litre Overhead Tank (OHT)`,
          assetType: "OVERHEAD_TANK",
          status: community.functioningWaterPointsCount > 20 ? "FUNCTIONAL" : "PARTIALLY_FUNCTIONAL",
          condition: community.infrastructureScore > 50 ? "Good" : "Fair",
          latitude: community.latitude + 0.002,
          longitude: community.longitude + 0.001,
          verifiedAt: new Date(),
        },
      });

      // Alerts for High/Severe CWC flood risk
      if (["Severe", "High"].includes(s.floodHazardLevel)) {
        await prisma.alert.create({
          data: {
            alertType: "FLOOD_HAZARD_OVERLAP",
            severity: s.floodHazardLevel === "Severe" ? "CRITICAL" : "HIGH",
            title: `Hydrological Inundation Hazard: ${community.name}`,
            message: `${community.name} in ${community.district} is situated in a CWC ${s.floodHazardLevel} flood risk zone with ${s.rainfallAnnualMm}mm annual rainfall. Elevated risk of coastal storm surge and wellhead contamination.`,
            communityId: community.id,
            source: "Central Water Commission & IMD Hydrological Monitoring",
            status: "ACTIVE",
          },
        });
      }

      // Alerts for high modelled vulnerability signal
      if (fingerprint.compositeScore >= 60) {
        await prisma.alert.create({
          data: {
            alertType: "THRESHOLD_EXCEEDED",
            severity: fingerprint.compositeScore >= 70 ? "CRITICAL" : "HIGH",
            title: `High Vulnerability Signal: ${community.name}`,
            message: `Composite vulnerability signal is ${fingerprint.compositeScore}/100. Primary driver: ${fingerprint.primaryRiskDriver}. Prioritized for Jal Jeevan Mission capital intervention.`,
            communityId: community.id,
            source: "AQUA-LENS National Risk Engine v1",
            status: "ACTIVE",
          },
        });
      }

      // Field verification entry for selected settlements
      if (s.code === "TN-RAM-01" || s.code === "TN-CUD-06" || s.code === "TN-NAG-09") {
        await prisma.fieldVerification.create({
          data: {
            communityId: community.id,
            officerId: officerUser.id,
            officerName: officerUser.name,
            verificationDate: new Date(),
            waterObservedPct: s.waterAccessPct - 3,
            sanitationObservedPct: s.sanitationAccessPct,
            infrastructureCondition: "Saline corroded pipeline valves; overhead tank pump operational on 3-phase grid.",
            notes: "Field audit confirmed seasonal drinking water stress. Desalination RO kiosk membrane requires replacement.",
            gpsLatitude: community.latitude,
            gpsLongitude: community.longitude,
            status: "VERIFIED",
          },
        });
      }
    }

    // 7. Interventions for Tamil Nadu
    const allCommunities = await prisma.community.findMany();
    const mandapam = allCommunities.find((c) => c.code === "TN-RAM-01")!;
    const parangipettai = allCommunities.find((c) => c.code === "TN-CUD-06")!;
    const vedaranyam = allCommunities.find((c) => c.code === "TN-NAG-09")!;
    const pennagaram = allCommunities.find((c) => c.code === "TN-DHA-11")!;

    await prisma.intervention.create({
      data: {
        communityId: mandapam.id,
        title: "Jal Jeevan Mission Solar RO Desalination & Distribution Kiosk",
        issueCategory: "RO_PURIFICATION_PLANT",
        recommendedAction: "Install 2,000 LPH Brackish Water Reverse Osmosis (BWRO) plant with solar PV backup to treat high-TDS coastal water.",
        priority: "CRITICAL",
        status: "IN_PROGRESS",
        proposedStartDate: new Date("2026-04-01"),
        proposedEndDate: new Date("2026-08-30"),
        assignedOrg: "TWAD Board & District Rural Development Agency (DRDA)",
        assignedOfficerId: officerUser.id,
        estimatedBudget: 4200000,
        fundingSource: "Jal Jeevan Mission Capital Grant",
        comments: "Hydro-geological testing completed. Foundation work for RO container underway.",
      },
    });

    await prisma.intervention.create({
      data: {
        communityId: parangipettai.id,
        title: "Flood-Resilient Elevated Wellhead Aprons & Coastal Bunding",
        issueCategory: "FLOOD_RESILIENT_WELLHEAD",
        recommendedAction: "Construct 2.5m elevated RCC sanitary wellhead platforms to prevent seawater inundation during cyclone surge.",
        priority: "CRITICAL",
        status: "APPROVED",
        proposedStartDate: new Date("2026-05-15"),
        proposedEndDate: new Date("2026-09-30"),
        assignedOrg: "Tamil Nadu State Disaster Management Authority & TWAD",
        assignedOfficerId: officerUser.id,
        estimatedBudget: 3500000,
        fundingSource: "State Disaster Mitigation Fund (SDMF)",
        comments: "Structural design vetted by Coastal Engineering Division.",
      },
    });

    await prisma.intervention.create({
      data: {
        communityId: vedaranyam.id,
        title: "Swachh Bharat Mission (Grameen) ODF Plus Sanitary Complex",
        issueCategory: "SBM_COMMUNITY_TOILET",
        recommendedAction: "Construct 2 Community Sanitary Complexes (CSC) with solar powered greywater soak pits for salt pan worker clusters.",
        priority: "HIGH",
        status: "PLANNED",
        proposedStartDate: new Date("2026-06-01"),
        proposedEndDate: new Date("2026-09-15"),
        assignedOrg: "District Rural Development Agency (DRDA) Nagapattinam",
        assignedOfficerId: officerUser.id,
        estimatedBudget: 1800000,
        fundingSource: "Swachh Bharat Mission (Grameen) Phase-II",
        comments: "Site selected in consultation with Gram Panchayat.",
      },
    });

    await prisma.intervention.create({
      data: {
        communityId: pennagaram.id,
        title: "Hogenakkal Water Scheme Branch Extension & Fluoride Monitoring",
        issueCategory: "JAL_JEEVAN_MISSION_FHTC",
        recommendedAction: "Rehabilitate 8.5 km feeder pipeline from Hogenakkal CWSS to guarantee fluoride-free treated water to 1,200 households.",
        priority: "HIGH",
        status: "COMPLETED",
        proposedStartDate: new Date("2026-01-10"),
        proposedEndDate: new Date("2026-03-15"),
        assignedOrg: "TWAD Board Dharmapuri Division",
        assignedOfficerId: officerUser.id,
        estimatedBudget: 5500000,
        fundingSource: "National Rural Drinking Water Quality Sub-Mission",
        comments: "Commissioned and handed over to Village Water and Sanitation Committee (VWSC).",
      },
    });

    // 8. Planning Scenario
    const scenario = await prisma.planningScenario.create({
      data: {
        name: "FY2026-27 Tamil Nadu Coastal & Salinity Basin Priority Allocation",
        description: "Targeted capital expenditure plan for Ramanathapuram, Cuddalore, and Nagapattinam coastal blocks under Jal Jeevan Mission and SBM-G.",
        totalBudget: 100000000,
        allocatedBudget: 54000000,
        remainingBudget: 46000000,
        populationTarget: 95000,
        estimatedReach: 82000,
        assumptionsJson: JSON.stringify({
          solarROPlantUnitCost: 2500000,
          pipedFHTCExtensionPerKm: 1200000,
          communitySanitaryComplexUnitCost: 650000,
          floodResilientPlatformUnitCost: 850000,
          ohtPumpOverhaulUnitCost: 250000,
        }),
        createdByUserId: analystUser.id,
      },
    });

    await prisma.scenarioAllocation.create({
      data: {
        scenarioId: scenario.id,
        communityId: mandapam.id,
        interventionType: "SOLAR_RO_DESALINATION",
        unitCost: 2500000,
        targetUnits: 4,
        allocatedAmount: 10000000,
        estimatedPopulationServed: 18200,
      },
    });

    await prisma.scenarioAllocation.create({
      data: {
        scenarioId: scenario.id,
        communityId: parangipettai.id,
        interventionType: "FLOOD_RESILIENT_PLATFORM",
        unitCost: 850000,
        targetUnits: 6,
        allocatedAmount: 5100000,
        estimatedPopulationServed: 32500,
      },
    });

    // 9. Standard Intervention Types
    await prisma.interventionType.create({
      data: {
        code: "WATER_ACCESS_IMPROVEMENT",
        name: "Water Access Improvement (JJM Har Ghar Jal & Solar RO)",
        description: "Provision of individual piped household tap connections (FHTC) and decentralized Solar RO Brackish Water Desalination kiosks in fluoride/salinity belts.",
        targetIndicator: "water_access",
        defaultCost: 2500000,
        defaultImpact: "Scenario estimate: water-access risk could decrease by approximately 18-24 points under the configured scenario assumptions.",
        assumptions: "Estimate assumes standard JJM 55 LPCD supply and 85% functionality retention over 5 years. Not a guaranteed outcome.",
        active: true,
      },
    });

    await prisma.interventionType.create({
      data: {
        code: "SANITATION_IMPROVEMENT",
        name: "Sanitation Infrastructure Improvement (SBM-G ODF Plus Complex)",
        description: "Construction of Community Sanitary Complexes (CSC) and individual household pour-flush latrine retrofitting to eliminate open defecation.",
        targetIndicator: "sanitation_access",
        defaultCost: 1500000,
        defaultImpact: "Scenario estimate: sanitation access gap could decrease by approximately 15-20 points under the configured scenario assumptions.",
        assumptions: "Estimate assumes active Gram Panchayat VWSC maintenance and community adoption. Not a guaranteed outcome.",
        active: true,
      },
    });

    await prisma.interventionType.create({
      data: {
        code: "FLOOD_MITIGATION",
        name: "Flood Preparedness & Raised Platforms (TNSDMA/CWC)",
        description: "Installation of elevated RCC wellhead platforms, backflow-prevention check valves, and storm surge bio-drainage bunds to safeguard potable sources.",
        targetIndicator: "flood_exposure",
        defaultCost: 1800000,
        defaultImpact: "Scenario estimate: flood vulnerability exposure could decrease by approximately 16-22 points under the configured scenario assumptions.",
        assumptions: "Estimate is calibrated to 10-year return period inundation thresholds documented in CWC hydrological atlas.",
        active: true,
      },
    });

    await prisma.interventionType.create({
      data: {
        code: "EMERGENCY_WATER_FLOOD",
        name: "Emergency Water Provision + Flood Resilient Wellheads",
        description: "Comprehensive emergency response package: dual-source deep borewell with elevated solar platform, rapid mobile purification, and emergency tanker reserve.",
        targetIndicator: "water_access_and_flood",
        defaultCost: 3500000,
        defaultImpact: "Scenario estimate: combined water and climate vulnerability could decrease by approximately 25-30 points under the configured scenario assumptions.",
        assumptions: "Estimate assumes simultaneous activation during monsoon inundation windows. Not a guaranteed real-world outcome.",
        active: true,
      },
    });

    await prisma.interventionType.create({
      data: {
        code: "INFRASTRUCTURE_REHABILITATION",
        name: "Critical Infrastructure Rehabilitation & OHT Overhaul (TWAD)",
        description: "Refurbishment of non-functional Overhead Tanks (OHTs), electro-mechanical pump replacement, and distribution line leak repairs.",
        targetIndicator: "infrastructure",
        defaultCost: 1200000,
        defaultImpact: "Scenario estimate: infrastructure resilience gap could decrease by approximately 15-20 points under the configured scenario assumptions.",
        assumptions: "Estimate is based on TWAD Board standard schedule of rates (SoR).",
        active: true,
      },
    });

    await prisma.interventionType.create({
      data: {
        code: "SOCIOECONOMIC_COMMUNITY_SUPPORT",
        name: "Targeted Subsidized Household WASH Connection Package",
        description: "Direct community subsidy program covering household last-mile connection fees, water meter installation, and water conservation training.",
        targetIndicator: "socioeconomic",
        defaultCost: 1000000,
        defaultImpact: "Scenario estimate: socioeconomic WASH barrier score could decrease by approximately 10-14 points under the configured scenario assumptions.",
        assumptions: "Estimate based on targeted welfare delivery across NFHS-5 multi-dimensionally deprived households.",
        active: true,
      },
    });

    // 10. Seed Complaint Center Data
    console.log("📢 Seeding Citizen Grievances & Complaint Center records...");
    const mandapamComm = await prisma.community.findFirst({ where: { code: "TN-RAM-01" } });
    const vedaranyamComm = await prisma.community.findFirst({ where: { code: "TN-NAG-09" } });
    const parangipettaiComm = await prisma.community.findFirst({ where: { code: "TN-CUD-06" } });
    const tiruvadanaiComm = await prisma.community.findFirst({ where: { code: "TN-RAM-02" } });
    const dharmapuriComm = await prisma.community.findFirst({ where: { code: "TN-DHA-11" } });
    const cuddaloreComm = await prisma.community.findFirst({ where: { code: "TN-CUD-08" } });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0001",
        title: "Main RO Plant Filter Clogging & Brackish Water Output",
        description: "Community RO plant membrane fouled after tidal surge. Water has high salinity (TDS > 1800 ppm) and yellow sediment. Over 3,000 residents forced to purchase private tanker water.",
        category: "WATER_QUALITY",
        status: "IN_PROGRESS",
        priority: "HIGH",
        priorityReason: "Critical drinking water source in high-vulnerability coastal community (Mandapam); affects large population.",
        locationName: "South Fishermen Colony, Ward 3, Mandapam",
        latitude: 9.2785,
        longitude: 79.1248,
        communityId: mandapamComm?.id,
        reporterId: null,
        reporterName: "K. Murugesan",
        reporterContact: "+91 98421 77652",
        isAnonymous: false,
        assignedOfficerId: officerUser.id,
        assignedOfficerName: officerUser.name,
        verificationStatus: "VERIFIED",
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        evidence: {
          create: [
            {
              fileUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800&auto=format&fit=crop",
              caption: "Fouled pre-filter cartridges and turbid discharge from community RO kiosk",
              fileType: "image",
            },
          ],
        },
        statusHistory: {
          create: [
            {
              oldStatus: "NONE",
              newStatus: "REPORTED",
              changedByName: "K. Murugesan (Citizen)",
              notes: "Grievance submitted via Aqua-Lens Mobile Portal.",
              createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
            },
            {
              oldStatus: "REPORTED",
              newStatus: "UNDER_REVIEW",
              changedByName: adminUser.name,
              notes: "Prioritized due to high baseline vulnerability score in Mandapam.",
              createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
            },
            {
              oldStatus: "UNDER_REVIEW",
              newStatus: "ASSIGNED",
              changedByName: adminUser.name,
              notes: `Assigned to ${officerUser.name} for field inspection.`,
              createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
            },
            {
              oldStatus: "ASSIGNED",
              newStatus: "IN_PROGRESS",
              changedByName: officerUser.name,
              notes: "Membrane replacement requisition submitted to TWAD maintenance division.",
              createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
            },
          ],
        },
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0002",
        title: "Pipeline Rupture under Beach Road - Contaminated Seepage",
        description: "Main potable distribution line ruptured near drainage culvert. Drain runoff is siphoning into drinking pipeline during low pressure cycles.",
        category: "WATER_SUPPLY",
        status: "ASSIGNED",
        priority: "CRITICAL",
        priorityReason: "Direct sewage-drinking water cross contamination hazard; immediate epidemic risk.",
        locationName: "Beach Road near Fish Landing Center, Mandapam",
        latitude: 9.2790,
        longitude: 79.1252,
        communityId: mandapamComm?.id,
        reporterName: "Anonymous Resident",
        isAnonymous: true,
        assignedOfficerId: officerUser.id,
        assignedOfficerName: officerUser.name,
        verificationStatus: "PENDING_VERIFICATION",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        statusHistory: {
          create: [
            {
              oldStatus: "NONE",
              newStatus: "REPORTED",
              changedByName: "Citizen (Anonymous)",
              notes: "Submitted anonymously with GPS coordinates.",
              createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
            },
            {
              oldStatus: "REPORTED",
              newStatus: "ASSIGNED",
              changedByName: adminUser.name,
              notes: "Marked CRITICAL by Automated Priority Engine. Assigned to Field Officer immediately.",
              createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
            },
          ],
        },
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0003",
        title: "Salt Water Inundation in Piped Scheme Borewell",
        description: "High tide storm surge overtopped the low wellhead apron. High salinity detected in all public standposts in East Jetty.",
        category: "FLOODING",
        status: "REPORTED",
        priority: "HIGH",
        priorityReason: "Coastal storm surge compound risk with water supply disruption in Mandapam.",
        locationName: "East Jetty Habitation, Mandapam",
        latitude: 9.2778,
        longitude: 79.1239,
        communityId: mandapamComm?.id,
        reporterName: "R. Kasinathan",
        reporterContact: "+91 97890 22341",
        isAnonymous: false,
        verificationStatus: "UNVERIFIED",
        createdAt: new Date(Date.now() - 12 * 3600 * 1000),
        statusHistory: {
          create: [
            {
              oldStatus: "NONE",
              newStatus: "REPORTED",
              changedByName: "R. Kasinathan",
              notes: "Reported via web form.",
              createdAt: new Date(Date.now() - 12 * 3600 * 1000),
            },
          ],
        },
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0004",
        title: "Overflowing Community Toilet Pit & Leaking Septic Tank",
        description: "SBM-G Community Sanitary Complex septic tank overflowing onto public footpath adjacent to primary school. Strong foul odor and flies breeding.",
        category: "SANITATION",
        status: "UNDER_REVIEW",
        priority: "CRITICAL",
        priorityReason: "Open sewage hazard near school in high-vulnerability salt pan panchayat.",
        locationName: "Salt Workers Colony, Sector 2, Vedaranyam",
        latitude: 10.3725,
        longitude: 79.8518,
        communityId: vedaranyamComm?.id,
        reporterName: "S. Meenakshi",
        reporterContact: "+91 94432 11980",
        isAnonymous: false,
        verificationStatus: "PENDING_VERIFICATION",
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        evidence: {
          create: [
            {
              fileUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop",
              caption: "Overflowing effluent tank at community toilet facility",
              fileType: "image",
            },
          ],
        },
        statusHistory: {
          create: [
            {
              oldStatus: "NONE",
              newStatus: "REPORTED",
              changedByName: "S. Meenakshi",
              notes: "Grievance lodged with photos.",
              createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
            },
            {
              oldStatus: "REPORTED",
              newStatus: "UNDER_REVIEW",
              changedByName: adminUser.name,
              notes: "Forwarded to Block Development Officer & TWAD Sanitation wing.",
              createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
            },
          ],
        },
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0005",
        title: "Stagnant Storm Drainage Backflow during High Tide",
        description: "Estuary drainage sluice gate jammed with debris. Tidal waters backflowing into 150 residential compounds, trapping stagnant saline water.",
        category: "DRAINAGE",
        status: "IN_PROGRESS",
        priority: "HIGH",
        priorityReason: "High flood hazard estuary settlement; repetitive tidal ingress.",
        locationName: "Kollidam River Tail-end Habitation, Parangipettai",
        latitude: 11.4985,
        longitude: 79.7648,
        communityId: parangipettaiComm?.id,
        reporterName: "P. Selvaraj",
        reporterContact: "+91 98840 55123",
        isAnonymous: false,
        assignedOfficerId: officerUser.id,
        assignedOfficerName: officerUser.name,
        verificationStatus: "VERIFIED",
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        statusHistory: {
          create: [
            {
              oldStatus: "NONE",
              newStatus: "REPORTED",
              changedByName: "P. Selvaraj",
              notes: "Reported.",
              createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
            },
            {
              oldStatus: "REPORTED",
              newStatus: "IN_PROGRESS",
              changedByName: officerUser.name,
              notes: "Earthmover deployed to clear silt and debris from sluice gate channel.",
              createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
            },
          ],
        },
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0006",
        title: "Broken Sluice Gate Causing Agricultural & Village Inundation",
        description: "Severe canal breach during cyclonic depression. Required emergency sandbagging and sluice repair.",
        category: "FLOODING",
        status: "RESOLVED",
        priority: "CRITICAL",
        priorityReason: "Critical breach in flood defense in Cuddalore cyclone belt.",
        locationName: "Estuary North Embankment, Parangipettai",
        latitude: 11.4990,
        longitude: 79.7655,
        communityId: parangipettaiComm?.id,
        reporterName: "GP President",
        isAnonymous: false,
        assignedOfficerId: officerUser.id,
        assignedOfficerName: officerUser.name,
        verificationStatus: "VERIFIED",
        resolutionNotes: "Emergency sandbag reinforcement completed by PWD & local community volunteers. Sluice gate re-hung and secured.",
        resolvedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        statusHistory: {
          create: [
            {
              oldStatus: "NONE",
              newStatus: "REPORTED",
              changedByName: "GP President",
              notes: "Emergency call.",
              createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
            },
            {
              oldStatus: "IN_PROGRESS",
              newStatus: "RESOLVED",
              changedByName: officerUser.name,
              notes: "Repairs verified on site.",
              createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
            },
          ],
        },
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0007",
        title: "Public Standpost Tap Broken & Water Wasted Daily",
        description: "Brass valve missing from public standpost. Water flows continuously during morning pumping hours, flooding the bus stop walkway.",
        category: "INFRASTRUCTURE",
        status: "RESOLVED",
        priority: "MEDIUM",
        priorityReason: "Distribution valve damage causing local water loss.",
        locationName: "Bus Stand Junction Standpost, Tiruvadanai",
        latitude: 9.7895,
        longitude: 78.9130,
        communityId: tiruvadanaiComm?.id,
        reporterName: "T. Arumugam",
        isAnonymous: false,
        assignedOfficerId: officerUser.id,
        assignedOfficerName: officerUser.name,
        verificationStatus: "VERIFIED",
        resolutionNotes: "Installed new heavy-duty push tap and reinforced concrete drainage apron.",
        resolvedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0008",
        title: "Illegal Solid Waste Dumping in Rainwater Harvesting Tank",
        description: "Commercial debris and plastic waste dumped inside the community oorani percolation pond, threatening groundwater quality.",
        category: "WASTE_MANAGEMENT",
        status: "REPORTED",
        priority: "HIGH",
        priorityReason: "Direct pollution of village traditional percolation pond.",
        locationName: "Eriyur Oorani Catchment, Dharmapuri",
        latitude: 12.0512,
        longitude: 77.8924,
        communityId: dharmapuriComm?.id,
        reporterName: "V. Govindaraj",
        isAnonymous: false,
        verificationStatus: "UNVERIFIED",
        createdAt: new Date(Date.now() - 18 * 3600 * 1000),
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0009",
        title: "Deep Borewell Salinity Spurt & Iron Rust Odor",
        description: "Borewell water has developed a metallic reddish tint and oily sheen. Clothes turning red when washed. Residents suspect casing pipe breach.",
        category: "WATER_QUALITY",
        status: "UNDER_REVIEW",
        priority: "HIGH",
        priorityReason: "Water quality degradation in coastal district.",
        locationName: "Old Port Light House Quarters, Cuddalore",
        latitude: 11.7230,
        longitude: 79.7710,
        communityId: cuddaloreComm?.id,
        reporterName: "R. Jayashree",
        reporterContact: "+91 94441 88921",
        isAnonymous: false,
        verificationStatus: "PENDING_VERIFICATION",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "CMP-2026-0010",
        title: "SBM-G Community Toilet Latrine Doors Damaged & No Water in Cistern",
        description: "Three out of four toilet cubicle doors broken off hinges. Overhead tank PVC feeder line disconnected.",
        category: "SANITATION",
        status: "CLOSED",
        priority: "LOW",
        priorityReason: "Minor fixture repair required in public toilet.",
        locationName: "Railway Feeder Road, Cuddalore",
        latitude: 11.7255,
        longitude: 79.7735,
        communityId: cuddaloreComm?.id,
        reporterName: "Anonymous Citizen",
        isAnonymous: true,
        verificationStatus: "VERIFIED",
        resolutionNotes: "Panchayat sanitation contractor repaired door hinges and plumbed a new 1-inch PVC line.",
        resolvedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      },
    });

    // 11. Initial Audit Log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        userName: adminUser.name,
        action: "SEED",
        entityType: "System",
        entityId: "INDIA_BASELINE_INIT",
        detailsJson: JSON.stringify({
          message: "AQUA-LENS India WASH Intelligence System initialized with Tamil Nadu coastal & semi-arid baseline blocks, Census 2011 demographics, JJM, SBM-G, IMD, and CWC indicators.",
          timestamp: new Date(),
        }),
      },
    });

    console.log("✅ AQUA-LENS India WASH Intelligence Seed Pipeline Completed Successfully!");
    return { success: true, count: indiaDemoSettlements.length };
  } finally {
    if (disconnectNeeded && prisma) {
      await prisma.$disconnect();
    }
  }
}
