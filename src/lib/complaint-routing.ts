export interface DepartmentRoutingResult {
  department: string;
  departmentCode: string;
  jurisdiction: string;
  nodalOfficer: string;
  slaHours: number;
  routingStatus: "ROUTED" | "ROUTING_PENDING";
  routingReason: string;
}

export function determineComplaintDepartment(params: {
  category: string;
  district?: string | null;
  block?: string | null;
  state?: string | null;
  communityName?: string | null;
}): DepartmentRoutingResult {
  const district = params.district || "Ramanathapuram";
  const block = params.block || "Taluk Jurisdiction";
  const state = params.state || "Tamil Nadu";
  const loc = params.communityName ? `${params.communityName}, ` : "";

  const jurisdiction = `${loc}${block}, ${district} District, ${state}`;

  switch (params.category) {
    case "WATER_SUPPLY":
      return {
        department: `Tamil Nadu Water Supply & Drainage (TWAD) Board — ${district} Rural Operations Division`,
        departmentCode: "TWAD_WATER_OPS",
        jurisdiction,
        nodalOfficer: `Assistant Executive Engineer (Water Supply & JJM), ${district}`,
        slaHours: 48,
        routingStatus: "ROUTED",
        routingReason: `Routed to TWAD Board pipeline maintenance division for ${district} based on water supply disruption signal.`,
      };

    case "WATER_QUALITY":
      return {
        department: `Jal Jeevan Mission WQMIS & District Water Quality Testing Laboratory, ${district}`,
        departmentCode: "JJM_WQMIS_LAB",
        jurisdiction,
        nodalOfficer: `Senior Chemist & District Quality Assurance Officer, ${district}`,
        slaHours: 24, // Rapid health intervention
        routingStatus: "ROUTED",
        routingReason: `Expedited to District Water Quality Testing Laboratory for immediate ground water sampling and bacteriological assay.`,
      };

    case "SANITATION":
      return {
        department: `Directorate of Rural Development & Panchayat Sanitation Cell, ${district}`,
        departmentCode: "SBM_SANITATION_CELL",
        jurisdiction,
        nodalOfficer: `Assistant Director (Panchayats & SBM-G), ${district}`,
        slaHours: 72,
        routingStatus: "ROUTED",
        routingReason: `Forwarded to Swachh Bharat Mission (Grameen) block team for community toilet and septage maintenance.`,
      };

    case "DRAINAGE":
      return {
        department: `Town Panchayat & Block Drainage Maintenance Engineering Wing, ${district}`,
        departmentCode: "BLOCK_DRAINAGE_ENG",
        jurisdiction,
        nodalOfficer: `Block Development Officer (Infrastructure), ${block}`,
        slaHours: 48,
        routingStatus: "ROUTED",
        routingReason: `Assigned to block civil engineering wing for mechanized drainage clearance and desilting.`,
      };

    case "FLOODING":
      return {
        department: `District Disaster Management Authority (DDMA) & CWC Inundation Control Cell, ${district}`,
        departmentCode: "DDMA_FLOOD_CELL",
        jurisdiction,
        nodalOfficer: `District Revenue Officer & Emergency Response Officer, ${district}`,
        slaHours: 12, // Urgent disaster priority
        routingStatus: "ROUTED",
        routingReason: `High-priority escalation to DDMA Emergency Operation Center for flood alleviation and pump deployment.`,
      };

    case "INFRASTRUCTURE":
      return {
        department: `TWAD Board Public Works & Rural Infrastructure Division, ${district}`,
        departmentCode: "TWAD_INFRA_ENG",
        jurisdiction,
        nodalOfficer: `Executive Engineer (Capital Works), ${district}`,
        slaHours: 96,
        routingStatus: "ROUTED",
        routingReason: `Routed to infrastructure engineering team for pipe replacement, structural inspection, and asset repair.`,
      };

    case "WASTE_MANAGEMENT":
      return {
        department: `Gram Panchayat Solid & Liquid Waste Management (SLWM) Cluster, ${district}`,
        departmentCode: "GP_SLWM_UNIT",
        jurisdiction,
        nodalOfficer: `Panchayat Secretary & Village Nodal Coordinator, ${block}`,
        slaHours: 48,
        routingStatus: "ROUTED",
        routingReason: `Assigned to local SLWM sanitation workers for refuse removal away from drinking water source.`,
      };

    default:
      return {
        department: `District Collectorate Public Grievance Redressal Cell, ${district}`,
        departmentCode: "COLLECTORATE_PGRC",
        jurisdiction,
        nodalOfficer: `Special Tahsildar (Grievance Redressal), ${district}`,
        slaHours: 72,
        routingStatus: "ROUTED",
        routingReason: `Assigned to Collectorate Public Grievance portal for administrative categorization and action.`,
      };
  }
}

// Generate server-side unique tracking ID
// Format: AQL-2026-[STATE_CODE]-[DISTRICT_CODE]-[6_DIGIT_COUNTER]
// Example: AQL-2026-TN-RAM-000124
export function generateUniqueTrackingId(
  paramsOrState?:
    | { state?: string | null; district?: string | null; count?: number }
    | string
    | null,
  districtArg?: string | null,
  countArg?: number
): string {
  let state = "Tamil Nadu";
  let district = "RAM";
  let count = 0;

  if (typeof paramsOrState === "object" && paramsOrState !== null) {
    state = paramsOrState.state || state;
    district = paramsOrState.district || district;
    count = paramsOrState.count ?? 0;
  } else {
    state = (paramsOrState as string) || state;
    district = districtArg || district;
    count = countArg ?? 0;
  }

  const stateCode =
    state
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "TN";

  const districtCode =
    district
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "RAM";

  const year = new Date().getFullYear();
  const counter = String(count).padStart(6, "0");

  return `AQL-${year}-${stateCode}-${districtCode}-${counter}`;
}

