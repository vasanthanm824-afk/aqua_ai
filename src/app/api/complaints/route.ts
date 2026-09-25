import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/db-auto-seed";
import { BASELINE_SETTLEMENTS } from "@/lib/fallback-data";
import { isAdminRole } from "@/lib/permissions";
import { sendGrievanceSmsConfirmation, formatIndianPhoneNumber } from "@/lib/sms";
import {
  findNearestCommunity,
  evaluateComplaintPriority,
  detectComplaintHotspots,
} from "@/lib/complaints";
import {
  determineComplaintDepartment,
  generateUniqueTrackingId,
} from "@/lib/complaint-routing";

export async function GET(request: Request) {
  try {
    await ensureDatabaseSeeded();
    const session = await getSessionUser();
    const isAdmin = isAdminRole(session?.role);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const communityId = searchParams.get("communityId");
    const verificationStatus = searchParams.get("verificationStatus");
    const assignedOfficerId = searchParams.get("assignedOfficerId");
    const myOnly = searchParams.get("my") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

    const where: any = {};

    // User scope constraint: non-admin or explicit ?my=true returns only user's own complaints
    if ((myOnly || !isAdmin) && session?.id) {
      where.reporterId = session.id;
    }

    if (category && category !== "ALL") where.category = category;
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (communityId && communityId !== "ALL") where.communityId = communityId;
    if (verificationStatus && verificationStatus !== "ALL") where.verificationStatus = verificationStatus;
    if (assignedOfficerId && assignedOfficerId !== "ALL") where.assignedOfficerId = assignedOfficerId;

    if (search) {
      where.OR = [
        { complaintNumber: { contains: search } },
        { trackingId: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
        { locationName: { contains: search } },
        { reporterContact: { contains: search } },
      ];
    }

    const [complaints, allForStats] = await Promise.all([
      prisma.complaint.findMany({
        where,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: {
          community: {
            select: {
              id: true,
              name: true,
              code: true,
              district: true,
              block: true,
              state: true,
              compositeVulnerabilityScore: true,
              vulnerabilityCategory: true,
              waterAccessPct: true,
              sanitationAccessPct: true,
              floodHazardLevel: true,
              infrastructureScore: true,
            },
          },
          evidence: true,
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          verifications: {
            select: {
              id: true,
              status: true,
              verificationDate: true,
              officerName: true,
            },
          },
        },
      }),
      prisma.complaint.findMany({
        select: {
          id: true,
          category: true,
          status: true,
          priority: true,
          verificationStatus: true,
          latitude: true,
          longitude: true,
          communityId: true,
          community: {
            select: { name: true },
          },
        },
      }),
    ]);

    // KPI Calculations
    const total = allForStats.length;
    const open = allForStats.filter((c) =>
      ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"].includes(c.status)
    ).length;
    const underReview = allForStats.filter((c) => c.status === "UNDER_REVIEW").length;
    const inProgress = allForStats.filter((c) => c.status === "IN_PROGRESS").length;
    const resolved = allForStats.filter((c) => c.status === "RESOLVED").length;
    const closed = allForStats.filter((c) => c.status === "CLOSED").length;
    const highPriority = allForStats.filter((c) =>
      ["HIGH", "CRITICAL"].includes(c.priority)
    ).length;
    const verified = allForStats.filter((c) => c.verificationStatus === "VERIFIED").length;

    // Category Distribution
    const catMap: Record<string, number> = {};
    allForStats.forEach((c) => {
      catMap[c.category] = (catMap[c.category] || 0) + 1;
    });
    const categoryDistribution = Object.entries(catMap).map(([cat, count]) => ({
      category: cat,
      count,
    }));

    // Status Distribution
    const statusMap: Record<string, number> = {};
    allForStats.forEach((c) => {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(([st, count]) => ({
      status: st,
      count,
    }));

    // Detect Geographic Concentrations / Hotspots
    const hotspots = detectComplaintHotspots(allForStats);

    return NextResponse.json({
      success: true,
      data: complaints,
      kpis: {
        total,
        open,
        underReview,
        inProgress,
        resolved,
        closed,
        highPriority,
        verified,
      },
      categoryDistribution,
      statusDistribution,
      hotspots,
    });
  } catch (error: any) {
    console.error("GET /api/complaints error:", error);
    return NextResponse.json({ error: error.message || "Failed to load complaints" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    const body = await request.json();

    const {
      title,
      description,
      category,
      locationName,
      latitude,
      longitude,
      locationAccuracy,
      locationCapturedAt,
      evidenceCapturedAt,
      language = "en",
      communityId,
      reporterName,
      reporterContact,
      phoneNumber,
      isAnonymous = false,
      evidence = [],
    } = body;

    // Strict Phone Number Validation (Section 3)
    const rawPhone = (phoneNumber || reporterContact || "").trim();
    const phoneInfo = formatIndianPhoneNumber(rawPhone);

    if (!rawPhone || !phoneInfo.isValid) {
      return NextResponse.json(
        {
          error:
            "A valid 10-digit Indian mobile number is required (+91 6xxxx-9xxxx) to register a grievance.",
        },
        { status: 400 }
      );
    }

    // Required fields: Description & Category
    if (!description || !category) {
      return NextResponse.json(
        { error: "Detailed description and grievance category are required." },
        { status: 400 }
      );
    }

    const resolvedTitle =
      (title || "").trim() ||
      String(category).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) + " Grievance";

    const resolvedLocationName = (locationName || "").trim() || "Location not specified";

    const lat = typeof latitude === "number" ? latitude : parseFloat(latitude) || null;
    const lng = typeof longitude === "number" ? longitude : parseFloat(longitude) || null;
    const locAcc = typeof locationAccuracy === "number" ? locationAccuracy : parseFloat(locationAccuracy) || null;

    // Resolve Community: Use provided communityId or automatically match nearest community
    let resolvedCommunityId = communityId || null;
    let resolvedCommunity: any = null;

    if (resolvedCommunityId) {
      try {
        resolvedCommunity = await prisma.community.findUnique({
          where: { id: resolvedCommunityId },
        });
      } catch (e) {}
      if (!resolvedCommunity) {
        resolvedCommunity = BASELINE_SETTLEMENTS.find(
          (c) => c.id === resolvedCommunityId || c.code === resolvedCommunityId
        );
      }
    } else if (lat !== null && lng !== null) {
      let allCommunities: any[] = [];
      try {
        allCommunities = await prisma.community.findMany({
          select: {
            id: true,
            name: true,
            state: true,
            district: true,
            block: true,
            latitude: true,
            longitude: true,
            compositeVulnerabilityScore: true,
            vulnerabilityCategory: true,
          },
        });
      } catch (e) {}
      if (!allCommunities || allCommunities.length === 0) {
        allCommunities = BASELINE_SETTLEMENTS as any;
      }
      const nearest = findNearestCommunity(lat, lng, allCommunities);
      if (nearest) {
        resolvedCommunityId = nearest.community.id;
        resolvedCommunity = nearest.community;
      }
    }

    // Determine Administrative Jurisdiction & Responsible Department Routing
    const routing = determineComplaintDepartment({
      category,
      district: resolvedCommunity?.district,
      block: resolvedCommunity?.block,
      state: resolvedCommunity?.state,
      communityName: resolvedCommunity?.name || locationName,
    });

    // Generate server-side unique tracking IDs (Section 6)
    let count = 10;
    try {
      count = await prisma.complaint.count();
    } catch (e) {}
    const complaintNumber = `CMP-2026-${String(count + 1).padStart(4, "0")}`;
    const trackingId = generateUniqueTrackingId({
      state: resolvedCommunity?.state,
      district: resolvedCommunity?.district,
      count,
    });

    // Audit network signal
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    let similarCount = 0;
    if (resolvedCommunityId) {
      try {
        similarCount = await prisma.complaint.count({
          where: {
            communityId: resolvedCommunityId,
            category,
            status: { in: ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"] },
          },
        });
      } catch (e) {}
    }

    // Transparent Rule-Based Priority Evaluation
    const { priority, reason: priorityReason } = evaluateComplaintPriority({
      category,
      communityVulnerabilityScore: resolvedCommunity?.compositeVulnerabilityScore || 50,
      similarRecentComplaintsCount: similarCount,
    });

    // Reporter Identity
    const finalReporterName = isAnonymous
      ? "Citizen (Anonymous)"
      : reporterName?.trim() || session?.name || "Citizen Reporter";

    const finalReporterContact = phoneInfo.formatted;

    // STEP 1: CREATE THE COMPLAINT IN DATABASE FIRST (Section 5)
    const newComplaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        trackingId,
        title: resolvedTitle,
        description: description.trim(),
        category,
        status: "REPORTED",
        priority,
        priorityReason,
        language,
        locationName: resolvedLocationName,
        latitude: lat,
        longitude: lng,
        locationAccuracy: locAcc,
        locationCapturedAt: locationCapturedAt ? new Date(locationCapturedAt) : lat ? new Date() : null,
        evidenceCapturedAt: evidenceCapturedAt ? new Date(evidenceCapturedAt) : null,
        routedDepartment: routing.department,
        jurisdiction: routing.jurisdiction,
        routingStatus: routing.routingStatus,
        clientIp,
        communityId: resolvedCommunityId,
        reporterId: session ? session.id : null,
        reporterName: finalReporterName,
        reporterContact: finalReporterContact,
        isAnonymous: !!isAnonymous,
        verificationStatus: "UNVERIFIED",
        evidence: {
          create: Array.isArray(evidence)
            ? evidence.map((e: any) => ({
                fileUrl: e.fileUrl || e.url || e.dataUrl,
                caption: e.caption || "Live camera evidence",
                fileType: e.fileType || "image",
                captureType: e.captureType || "LIVE_CAMERA",
                latitude: e.latitude ?? lat,
                longitude: e.longitude ?? lng,
                locationAccuracy: e.locationAccuracy ?? locAcc,
              }))
            : [],
        },
        statusHistory: {
          create: [
            {
              oldStatus: "NONE",
              newStatus: "REPORTED",
              changedById: session?.id || null,
              changedByName: finalReporterName,
              notes: `Citizen registered grievance with contact ${phoneInfo.formatted}. Language: ${language.toUpperCase()}.`,
            },
            {
              oldStatus: "REPORTED",
              newStatus: "ROUTED",
              changedById: null,
              changedByName: "Automatic Department Routing Engine",
              notes: `Forwarded to ${routing.department} (${routing.jurisdiction}). Nodal Officer: ${routing.nodalOfficer}. SLA: ${routing.slaHours} hours.`,
            },
          ],
        },
      },
      include: {
        community: true,
        evidence: true,
        statusHistory: true,
      },
    });

    // STEP 2: CREATE ADMIN NOTIFICATIONS (Section 9)
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMINISTRATOR" },
        select: { id: true },
      });
      if (adminUsers.length > 0) {
        await prisma.notification.createMany({
          data: adminUsers.map((admin) => ({
            userId: admin.id,
            title: "NEW CITIZEN GRIEVANCE",
            message: `Tracking ID: ${trackingId} | Category: ${category.replace(/_/g, " ")} | Location: ${resolvedLocationName} | Priority: ${priority}`,
            link: `/complaints/${newComplaint.id}`,
          })),
        });
      }
    } catch (notifErr) {
      console.warn("⚠️ Admin notification creation error:", notifErr);
    }

    // STEP 3: SEND SMS CONFIRMATION TO CITIZEN AFTER DATABASE CREATION (Section 10 & 11)
    let smsResult = null;
    try {
      smsResult = await sendGrievanceSmsConfirmation({
        toPhoneNumber: phoneInfo.formatted,
        trackingId,
        complaintNumber,
        category,
        department: routing.department,
        locationName: resolvedLocationName,
      });
    } catch (smsErr: any) {
      console.warn("⚠️ SMS dispatch error (Complaint remains valid in DB):", smsErr);
      smsResult = {
        success: false,
        status: "FAILED",
        provider: "SMS Service",
        recipient: phoneInfo.formatted,
        message: "",
        error: smsErr.message || "Failed to deliver SMS confirmation.",
      };
    }

    return NextResponse.json({
      success: true,
      message: "Grievance registered and routed successfully.",
      data: newComplaint,
      trackingId,
      complaintNumber,
      routing,
      smsResult,
    });
  } catch (error: any) {
    console.error("POST /api/complaints error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create complaint" },
      { status: 500 }
    );
  }
}
