import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasPermission } from "@/lib/auth";

export async function GET() {
  try {
    const sources = await prisma.dataSource.findMany({
      orderBy: { datasetTitle: "asc" },
      include: {
        _count: {
          select: {
            imports: true,
            datasetRecords: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: sources });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canConfigureScoring")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      sourceAgency,
      officialUrl,
      datasetTitle,
      indicatorName,
      indicatorDefinition,
      geographicLevel,
      referencePeriod,
      units,
      sourceStatus,
      confidenceNote,
      category,
    } = body;

    if (!datasetTitle || !sourceAgency || !category) {
      return NextResponse.json({ error: "datasetTitle, sourceAgency, and category are required" }, { status: 400 });
    }

    const source = await prisma.dataSource.create({
      data: {
        sourceAgency,
        officialUrl: officialUrl || "",
        datasetTitle,
        indicatorName: indicatorName || datasetTitle,
        indicatorDefinition: indicatorDefinition || "",
        geographicLevel: geographicLevel || "District",
        referencePeriod: referencePeriod || "2024",
        units: units || "%",
        sourceStatus: sourceStatus || "Official",
        confidenceNote: confidenceNote || null,
        category,
      },
    });

    return NextResponse.json({ success: true, data: source }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
