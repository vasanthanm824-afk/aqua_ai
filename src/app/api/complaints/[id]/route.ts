import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { complaintNumber: id }],
      },
      include: {
        community: {
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
            floodHazardLevel: true,
            infrastructureScore: true,
            compositeVulnerabilityScore: true,
            vulnerabilityCategory: true,
            sourceStatus: true,
            isSampleData: true,
          },
        },
        evidence: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        verifications: {
          include: {
            officer: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { verificationDate: "desc" },
        },
        assignedOfficerUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: complaint });
  } catch (error: any) {
    console.error("GET /api/complaints/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to load complaint" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.complaint.findFirst({
      where: { OR: [{ id }, { complaintNumber: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const {
      status,
      priority,
      priorityReason,
      assignedOfficerId,
      assignedOfficerName,
      verificationStatus,
      resolutionNotes,
      note,
    } = body;

    const updateData: any = {};
    let statusChangeNote: string | null = null;
    let oldStatus = existing.status;

    if (status && status !== existing.status) {
      updateData.status = status;
      statusChangeNote = note || `Status updated from ${oldStatus} to ${status}.`;
      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
        if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      } else if (status === "CLOSED") {
        if (!existing.resolvedAt) updateData.resolvedAt = new Date();
        if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      }
    }

    if (priority && priority !== existing.priority) {
      updateData.priority = priority;
      if (priorityReason) updateData.priorityReason = priorityReason;
    }

    if (assignedOfficerId !== undefined) {
      updateData.assignedOfficerId = assignedOfficerId || null;
      updateData.assignedOfficerName = assignedOfficerName || null;
      if (assignedOfficerName) {
        statusChangeNote = statusChangeNote
          ? `${statusChangeNote}; Assigned to ${assignedOfficerName}.`
          : `Assigned to ${assignedOfficerName}.`;
        // Auto transition from REPORTED to ASSIGNED if not yet assigned
        if (existing.status === "REPORTED" && !status) {
          updateData.status = "ASSIGNED";
        }
      }
    }

    if (verificationStatus && verificationStatus !== existing.verificationStatus) {
      updateData.verificationStatus = verificationStatus;
    }

    if (resolutionNotes && !updateData.resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
    }

    // Perform database update
    const updated = await prisma.complaint.update({
      where: { id: existing.id },
      data: {
        ...updateData,
        statusHistory: statusChangeNote || note
          ? {
              create: [
                {
                  oldStatus: oldStatus,
                  newStatus: updateData.status || existing.status,
                  changedById: session?.id || null,
                  changedByName: session?.name || "Operations Officer",
                  notes: note || statusChangeNote || "Complaint updated.",
                },
              ],
            }
          : undefined,
      },
      include: {
        community: true,
        evidence: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        verifications: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Complaint updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/complaints/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update complaint" },
      { status: 500 }
    );
  }
}
