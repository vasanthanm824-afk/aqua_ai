import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * Connects Complaint Center with the Field Verification module (Requirement 12).
 * Creates a FieldVerification task linked to the complaint and transitions
 * the complaint's verificationStatus to PENDING_VERIFICATION or VERIFIED.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const complaint = await prisma.complaint.findFirst({
      where: { OR: [{ id }, { complaintNumber: id }] },
      include: { community: true },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    if (!complaint.communityId) {
      return NextResponse.json(
        { error: "Cannot create field verification: complaint is not linked to an Aqua-Lens settlement." },
        { status: 400 }
      );
    }

    const {
      officerId = session?.id || null,
      officerName = session?.name || "Field Verification Team",
      notes = `Field inspection initiated from complaint ${complaint.complaintNumber}: ${complaint.title}. Category: ${complaint.category}.`,
      waterObservedPct = complaint.community?.waterAccessPct ?? 50,
      sanitationObservedPct = complaint.community?.sanitationAccessPct ?? 50,
      infrastructureCondition = "Fair",
      status = "PENDING_REVIEW",
    } = body;

    // Create the FieldVerification record linked to this complaint
    const verification = await prisma.fieldVerification.create({
      data: {
        communityId: complaint.communityId,
        complaintId: complaint.id,
        officerId,
        officerName,
        verificationDate: new Date(),
        waterObservedPct,
        sanitationObservedPct,
        infrastructureCondition,
        notes,
        gpsLatitude: complaint.latitude,
        gpsLongitude: complaint.longitude,
        status,
      },
      include: {
        community: {
          select: { name: true, district: true, block: true },
        },
      },
    });

    // Update complaint verification status & add to status history
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        verificationStatus: status === "VERIFIED" ? "VERIFIED" : "PENDING_VERIFICATION",
        statusHistory: {
          create: [
            {
              oldStatus: complaint.status,
              newStatus: complaint.status,
              changedById: session?.id || null,
              changedByName: session?.name || "System Dispatcher",
              notes: `Field verification task created (ID: ${verification.id}) assigned to ${officerName}.`,
            },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Field verification task successfully generated and linked to complaint.",
      data: verification,
    });
  } catch (error: any) {
    console.error("POST /api/complaints/[id]/verify error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create field verification task" },
      { status: 500 }
    );
  }
}
