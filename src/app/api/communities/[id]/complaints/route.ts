import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [community, complaints] = await Promise.all([
      prisma.community.findUnique({
        where: { id },
        select: { id: true, name: true, code: true, district: true },
      }),
      prisma.complaint.findMany({
        where: { communityId: id },
        orderBy: { createdAt: "desc" },
        include: {
          evidence: true,
          verifications: {
            select: { id: true, status: true, verificationDate: true },
          },
        },
      }),
    ]);

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const total = complaints.length;
    const open = complaints.filter((c) =>
      ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"].includes(c.status)
    ).length;
    const water = complaints.filter((c) =>
      ["WATER_SUPPLY", "WATER_QUALITY"].includes(c.category)
    ).length;
    const sanitation = complaints.filter((c) => c.category === "SANITATION").length;
    const flooding = complaints.filter((c) =>
      ["FLOODING", "DRAINAGE"].includes(c.category)
    ).length;
    const verified = complaints.filter((c) => c.verificationStatus === "VERIFIED").length;

    return NextResponse.json({
      success: true,
      community,
      signals: {
        total,
        open,
        water,
        sanitation,
        flooding,
        verified,
      },
      recentComplaints: complaints.slice(0, 5),
    });
  } catch (error: any) {
    console.error("GET /api/communities/[id]/complaints error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load community complaint signals" },
      { status: 500 }
    );
  }
}
