import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/db-auto-seed";

export async function GET(request: Request) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (severity && severity !== "ALL") where.severity = severity;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: [
        { severity: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        community: {
          select: {
            id: true,
            name: true,
            code: true,
            state: true,
            district: true,
            block: true,
            compositeVulnerabilityScore: true,
            floodHazardLevel: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    const body = await request.json();
    const { alertId, status } = body;

    if (!alertId || !status) {
      return NextResponse.json({ error: "Alert ID and status are required" }, { status: 400 });
    }

    const data: any = { status };
    if (status === "ACKNOWLEDGED") {
      data.acknowledgedByUserId = session?.id || null;
      data.acknowledgedAt = new Date();
    } else if (status === "RESOLVED") {
      data.resolvedAt = new Date();
    }

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data,
    });

    return NextResponse.json({ success: true, data: alert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
