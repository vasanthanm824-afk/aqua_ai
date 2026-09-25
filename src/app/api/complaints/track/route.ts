import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingQuery = searchParams.get("id")?.trim();

    if (!trackingQuery) {
      return NextResponse.json(
        { error: "Tracking ID or Complaint Number is required." },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [
          { trackingId: { equals: trackingQuery } },
          { complaintNumber: { equals: trackingQuery } },
          { id: { equals: trackingQuery } },
        ],
      },
      select: {
        id: true,
        trackingId: true,
        complaintNumber: true,
        title: true,
        description: true,
        category: true,
        status: true,
        priority: true,
        language: true,
        locationName: true,
        routedDepartment: true,
        jurisdiction: true,
        routingStatus: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        resolutionNotes: true,
        evidence: {
          select: {
            id: true,
            caption: true,
            fileType: true,
            captureType: true,
            uploadedAt: true,
          },
        },
        statusHistory: {
          select: {
            id: true,
            oldStatus: true,
            newStatus: true,
            changedByName: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        community: {
          select: {
            id: true,
            name: true,
            district: true,
            block: true,
            state: true,
            compositeVulnerabilityScore: true,
            waterAccessPct: true,
            sanitationAccessPct: true,
            floodHazardLevel: true,
          },
        },
        // IMPORTANT (Requirement 19): Never expose citizen's private personal contact/identity publicly
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: `No grievance found matching Tracking ID: "${trackingQuery}". Please verify the tracking number.` },
        { status: 404 }
      );
    }

    // Determine completed steps on the canonical 8-step lifecycle timeline
    // 1. Complaint Registered
    // 2. Sent to Department (ROUTED)
    // 3. Under Review (UNDER_REVIEW)
    // 4. Officer Assigned (ASSIGNED)
    // 5. In Progress (IN_PROGRESS)
    // 6. Field Verified (FIELD_VERIFIED)
    // 7. Action Taken (ACTION_TAKEN)
    // 8. Resolved & Closed (RESOLVED / CLOSED)
    const STATUS_ORDER = [
      "REPORTED",
      "ROUTED",
      "UNDER_REVIEW",
      "ASSIGNED",
      "IN_PROGRESS",
      "FIELD_VERIFIED",
      "ACTION_TAKEN",
      "RESOLVED",
      "CLOSED",
    ];

    const currentStatusIndex = STATUS_ORDER.indexOf(complaint.status);

    const timeline = [
      {
        step: 1,
        title: "Complaint Registered",
        description: "Citizen grievance officially recorded with live evidence.",
        completed: currentStatusIndex >= 0,
        active: complaint.status === "REPORTED",
        timestamp: complaint.createdAt,
      },
      {
        step: 2,
        title: "Sent to Department",
        description: complaint.routedDepartment
          ? `Forwarded to ${complaint.routedDepartment}`
          : "Routed to responsible jurisdiction authority",
        completed: currentStatusIndex >= 1 || !!complaint.routedDepartment,
        active: complaint.status === "ROUTED",
        timestamp: complaint.statusHistory.find((h) => h.newStatus === "ROUTED")?.createdAt || complaint.createdAt,
      },
      {
        step: 3,
        title: "Under Review",
        description: "Department nodal desk analyzing complaint severity and priority.",
        completed: currentStatusIndex >= 2,
        active: complaint.status === "UNDER_REVIEW",
        timestamp: complaint.statusHistory.find((h) => h.newStatus === "UNDER_REVIEW")?.createdAt,
      },
      {
        step: 4,
        title: "Officer Assigned",
        description: "Field engineer assigned for ground-truth inspection.",
        completed: currentStatusIndex >= 3,
        active: complaint.status === "ASSIGNED",
        timestamp: complaint.statusHistory.find((h) => h.newStatus === "ASSIGNED")?.createdAt,
      },
      {
        step: 5,
        title: "In Progress",
        description: "Engineering teams deployed or repair task underway.",
        completed: currentStatusIndex >= 4,
        active: complaint.status === "IN_PROGRESS",
        timestamp: complaint.statusHistory.find((h) => h.newStatus === "IN_PROGRESS")?.createdAt,
      },
      {
        step: 6,
        title: "Field Verification",
        description:
          complaint.verificationStatus === "VERIFIED"
            ? "Ground inspection completed and evidence verified."
            : "Awaiting field officer ground-truth verification.",
        completed: complaint.verificationStatus === "VERIFIED" || currentStatusIndex >= 5,
        active: complaint.status === "FIELD_VERIFIED",
        timestamp: complaint.statusHistory.find((h) => h.newStatus === "FIELD_VERIFIED")?.createdAt,
      },
      {
        step: 7,
        title: "Action Taken",
        description: "Remedial intervention implemented by local authority.",
        completed: currentStatusIndex >= 6,
        active: complaint.status === "ACTION_TAKEN",
        timestamp: complaint.statusHistory.find((h) => h.newStatus === "ACTION_TAKEN")?.createdAt,
      },
      {
        step: 8,
        title: "Resolved & Closed",
        description: complaint.resolutionNotes || "Issue resolved and grievance closed.",
        completed: currentStatusIndex >= 7,
        active: ["RESOLVED", "CLOSED"].includes(complaint.status),
        timestamp: complaint.resolvedAt,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        ...complaint,
        timeline,
      },
    });
  } catch (error: any) {
    console.error("GET /api/complaints/track error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve complaint tracking status." },
      { status: 500 }
    );
  }
}
