import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BASELINE_SETTLEMENTS } from "@/lib/fallback-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let community: any = null;
    let complaints: any[] = [];

    try {
      const [cRes, cmpRes] = await Promise.all([
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
      community = cRes;
      complaints = cmpRes || [];
    } catch (e) {}

    if (!community) {
      const fallback = BASELINE_SETTLEMENTS.find(
        (c) => c.id === id || c.code === id || c.name.toLowerCase() === id.toLowerCase()
      );
      if (fallback) {
        community = {
          id: fallback.id,
          name: fallback.name,
          code: fallback.code,
          district: fallback.district,
        };
      }
    }

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
