import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGrievanceSmsConfirmation, formatIndianPhoneNumber } from "@/lib/sms";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { trackingId: id }, { complaintNumber: id }],
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Grievance record not found." },
        { status: 404 }
      );
    }

    const rawPhone = complaint.reporterContact || "";
    const phoneInfo = formatIndianPhoneNumber(rawPhone);

    if (!phoneInfo.isValid) {
      return NextResponse.json(
        { error: "No valid contact phone number associated with this grievance record." },
        { status: 400 }
      );
    }

    const trackingId = complaint.trackingId || complaint.complaintNumber;

    const smsResult = await sendGrievanceSmsConfirmation({
      toPhoneNumber: phoneInfo.formatted,
      trackingId,
      complaintNumber: complaint.complaintNumber,
      category: complaint.category,
      department: complaint.routedDepartment || "Water Supply Authority",
      locationName: complaint.locationName,
    });

    return NextResponse.json({
      success: smsResult.success,
      message: smsResult.success
        ? "SMS tracking confirmation dispatched successfully."
        : "SMS delivery attempt failed. Please check provider status.",
      smsResult,
    });
  } catch (error: any) {
    console.error("POST /api/complaints/[id]/resend-sms error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend SMS confirmation." },
      { status: 500 }
    );
  }
}
