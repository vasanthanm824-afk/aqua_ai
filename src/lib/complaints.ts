/**
 * AQUA-LENS Complaint Intelligence Engine
 * 
 * Reusable utility layer for complaint priority calculation, spatial clustering/hotspots,
 * category definitions, and explainable community linkage.
 */

export const COMPLAINT_CATEGORIES = [
  { value: "WATER_SUPPLY", label: "Water Supply", description: "Piped network deficit, pressure loss, dry taps, tanker disruption", color: "#00f2fe" },
  { value: "WATER_QUALITY", label: "Water Quality", description: "Salinity, turbidity, iron/fluoride contamination, odor", color: "#38bdf8" },
  { value: "SANITATION", label: "Sanitation", description: "Community toilet defects, overflowing septic tanks, open defecation risk", color: "#f59e0b" },
  { value: "DRAINAGE", label: "Drainage", description: "Blocked storm drains, wastewater stagnation, silt accumulation", color: "#a855f7" },
  { value: "FLOODING", label: "Flooding & Inundation", description: "Breached bunds, monsoon inundation, tidal ingress, storm surges", color: "#ef4444" },
  { value: "INFRASTRUCTURE", label: "Infrastructure", description: "Damaged OHT tanks, pump mechanical failure, broken valves", color: "#64748b" },
  { value: "WASTE_MANAGEMENT", label: "Waste Management", description: "Solid waste dumping in water catchment or percolation tanks", color: "#10b981" },
  { value: "OTHER", label: "Other WASH Issue", description: "General community environmental health grievances", color: "#94a3b8" },
] as const;

export type ComplaintCategoryValue = typeof COMPLAINT_CATEGORIES[number]["value"];

export const COMPLAINT_STATUSES = [
  { value: "REPORTED", label: "Reported", color: "bg-slate-800 text-slate-300 border-slate-700" },
  { value: "UNDER_REVIEW", label: "Under Review", color: "bg-amber-950/80 text-amber-300 border-amber-800" },
  { value: "ASSIGNED", label: "Assigned", color: "bg-blue-950/80 text-blue-300 border-blue-800" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-cyan-950/80 text-cyan-300 border-cyan-800" },
  { value: "RESOLVED", label: "Resolved", color: "bg-emerald-950/80 text-emerald-300 border-emerald-800" },
  { value: "CLOSED", label: "Closed", color: "bg-slate-900 text-slate-400 border-slate-800" },
] as const;

export type ComplaintStatusValue = typeof COMPLAINT_STATUSES[number]["value"];

export const COMPLAINT_PRIORITIES = [
  { value: "LOW", label: "Low", badgeClass: "bg-slate-800 text-slate-300 border-slate-700" },
  { value: "MEDIUM", label: "Medium", badgeClass: "bg-blue-950/80 text-blue-300 border-blue-800" },
  { value: "HIGH", label: "High", badgeClass: "bg-amber-950/80 text-amber-300 border-amber-800" },
  { value: "CRITICAL", label: "Critical", badgeClass: "bg-red-950/80 text-red-300 border-red-800" },
] as const;

export type ComplaintPriorityValue = typeof COMPLAINT_PRIORITIES[number]["value"];

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest Aqua-Lens community for given coordinates.
 */
export function findNearestCommunity(
  latitude: number,
  longitude: number,
  communities: Array<{ id: string; name: string; latitude: number; longitude: number; [key: string]: any }>,
  maxDistanceKm: number = 30
): { community: typeof communities[0]; distanceKm: number } | null {
  if (!communities.length) return null;

  let nearest: typeof communities[0] | null = null;
  let minDistance = Infinity;

  for (const c of communities) {
    if (typeof c.latitude === "number" && typeof c.longitude === "number") {
      const dist = calculateDistanceKm(latitude, longitude, c.latitude, c.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = c;
      }
    }
  }

  if (nearest && minDistance <= maxDistanceKm) {
    return { community: nearest, distanceKm: Math.round(minDistance * 10) / 10 };
  }
  return null;
}

/**
 * Evaluates complaint priority transparently based on category, vulnerability context,
 * and duplicate complaints without modifying official vulnerability scores.
 */
export function evaluateComplaintPriority(input: {
  category: string;
  communityVulnerabilityScore?: number;
  communityVulnerabilityCategory?: string;
  similarRecentComplaintsCount?: number;
}): { priority: ComplaintPriorityValue; reason: string } {
  const {
    category,
    communityVulnerabilityScore = 50,
    similarRecentComplaintsCount = 0,
  } = input;

  const reasons: string[] = [];
  let score = 0;

  // 1. Category severity weight
  if (category === "WATER_QUALITY" || category === "FLOODING") {
    score += 40;
    reasons.push(`${category === "WATER_QUALITY" ? "Water quality/contamination" : "Flooding/inundation hazard"} carries high health/safety impact`);
  } else if (category === "WATER_SUPPLY" || category === "SANITATION") {
    score += 30;
    reasons.push(`${category === "WATER_SUPPLY" ? "Potable water supply interruption" : "Sanitation defect"} affects daily household living`);
  } else if (category === "DRAINAGE") {
    score += 20;
    reasons.push("Drainage blockage poses localized vector and waterlogging risk");
  } else {
    score += 10;
    reasons.push("Standard public infrastructure / civic grievance");
  }

  // 2. Community Vulnerability context
  if (communityVulnerabilityScore >= 75) {
    score += 35;
    reasons.push(`Settlement baseline is rated HIGH vulnerability (${Math.round(communityVulnerabilityScore)}/100)`);
  } else if (communityVulnerabilityScore >= 60) {
    score += 20;
    reasons.push(`Settlement baseline is rated MODERATE-HIGH vulnerability (${Math.round(communityVulnerabilityScore)}/100)`);
  }

  // 3. Cluster / Repeated complaints
  if (similarRecentComplaintsCount >= 2) {
    score += 25;
    reasons.push(`${similarRecentComplaintsCount} similar complaints reported in this area recently`);
  }

  // Classify
  let priority: ComplaintPriorityValue = "MEDIUM";
  if (score >= 75) priority = "CRITICAL";
  else if (score >= 50) priority = "HIGH";
  else if (score >= 30) priority = "MEDIUM";
  else priority = "LOW";

  return {
    priority,
    reason: reasons.join("; "),
  };
}

export interface ComplaintHotspot {
  id: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  complaintCount: number;
  communityId?: string | null;
  communityName?: string | null;
  primaryCategory: string;
  complaintIds: string[];
  disclaimer: string;
}

/**
 * Geographic Cluster / Concentration Detection
 * Identifies spatial groups of 2 or more unresolved complaints within 3km.
 * IMPORTANT: Explicitly marked as potential complaint concentration, NOT clinical proof of disease/contamination.
 */
export function detectComplaintHotspots(
  complaints: Array<{
    id: string;
    latitude?: number | null;
    longitude?: number | null;
    category: string;
    status: string;
    communityId?: string | null;
    community?: { name: string } | null;
  }>,
  clusterRadiusKm: number = 3.5
): ComplaintHotspot[] {
  const valid = complaints.filter(
    (c) =>
      typeof c.latitude === "number" &&
      typeof c.longitude === "number" &&
      !["RESOLVED", "CLOSED"].includes(c.status)
  );

  const hotspots: ComplaintHotspot[] = [];
  const assigned = new Set<string>();

  for (let i = 0; i < valid.length; i++) {
    const c1 = valid[i];
    if (assigned.has(c1.id)) continue;

    const group = [c1];
    for (let j = i + 1; j < valid.length; j++) {
      const c2 = valid[j];
      if (assigned.has(c2.id)) continue;

      const dist = calculateDistanceKm(
        c1.latitude!,
        c1.longitude!,
        c2.latitude!,
        c2.longitude!
      );
      if (dist <= clusterRadiusKm) {
        group.push(c2);
      }
    }

    if (group.length >= 2) {
      group.forEach((g) => assigned.add(g.id));

      const avgLat = group.reduce((sum, g) => sum + g.latitude!, 0) / group.length;
      const avgLng = group.reduce((sum, g) => sum + g.longitude!, 0) / group.length;

      // Find predominant category
      const catCounts: Record<string, number> = {};
      group.forEach((g) => {
        catCounts[g.category] = (catCounts[g.category] || 0) + 1;
      });
      const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0];

      hotspots.push({
        id: `hotspot-${i + 1}`,
        centerLatitude: Math.round(avgLat * 10000) / 10000,
        centerLongitude: Math.round(avgLng * 10000) / 10000,
        radiusKm: clusterRadiusKm,
        complaintCount: group.length,
        communityId: c1.communityId,
        communityName: c1.community?.name || "Coastal Cluster Zone",
        primaryCategory: topCat,
        complaintIds: group.map((g) => g.id),
        disclaimer: "Potential Complaint Concentration — indicates spatial concentration of reported issues, not clinical proof of disease or contamination.",
      });
    }
  }

  return hotspots;
}
