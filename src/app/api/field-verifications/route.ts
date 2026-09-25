import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasPermission } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const communityId = searchParams.get("communityId");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (communityId) where.communityId = communityId;

    const verifications = await prisma.fieldVerification.findMany({
      where,
      orderBy: { verificationDate: "desc" },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            code: true,
            state: true,
            district: true,
            block: true,
            waterAccessPct: true,
            sanitationAccessPct: true,
            compositeVulnerabilityScore: true,
          },
        },
        officer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: verifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canSubmitFieldVerification")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      communityId,
      waterObservedPct,
      sanitationObservedPct,
      infrastructureCondition,
      notes,
      gpsLatitude,
      gpsLongitude,
      photoUrls = [],
    } = body;

    if (!communityId) {
      return NextResponse.json({ error: "Community is required" }, { status: 400 });
    }

    const verification = await prisma.fieldVerification.create({
      data: {
        communityId,
        officerId: session.id,
        officerName: session.name,
        verificationDate: new Date(),
        waterObservedPct: waterObservedPct !== undefined ? parseFloat(waterObservedPct) : null,
        sanitationObservedPct: sanitationObservedPct !== undefined ? parseFloat(sanitationObservedPct) : null,
        infrastructureCondition: infrastructureCondition || "Inspection Complete",
        notes: notes || "Routine ground audit",
        photoUrlsJson: JSON.stringify(photoUrls),
        gpsLatitude: gpsLatitude ? parseFloat(gpsLatitude) : null,
        gpsLongitude: gpsLongitude ? parseFloat(gpsLongitude) : null,
        status: "VERIFIED",
        syncedAt: new Date(),
      },
      include: {
        community: true,
      },
    });

    // Check if observed water access is drastically lower than reported (> 15% disparity)
    if (waterObservedPct !== undefined && verification.community.waterAccessPct - parseFloat(waterObservedPct) > 15) {
      await prisma.alert.create({
        data: {
          alertType: "FIELD_VERIFICATION_REQUIRED",
          severity: "HIGH",
          title: `Field Discrepancy Flagged: ${verification.community.name}`,
          message: `Field officer ${session.name} verified water access at ${waterObservedPct}%, compared to public registry record of ${verification.community.waterAccessPct}%. Registry data requires recalibration.`,
          communityId,
          source: "Field Verification Sensor Protocol",
          status: "ACTIVE",
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "CREATE",
        entityType: "FieldVerification",
        entityId: verification.id,
        detailsJson: JSON.stringify({ communityId, officer: session.name }),
      },
    });

    return NextResponse.json({ success: true, data: verification }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
