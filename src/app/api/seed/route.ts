import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

export async function GET() {
  try {
    const result = await seedDatabase(prisma);
    return NextResponse.json({
      success: true,
      message: "Database successfully seeded with AQUA-LENS baseline WASH dataset.",
      result,
    });
  } catch (error: any) {
    console.error("GET /api/seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await seedDatabase(prisma);
    return NextResponse.json({
      success: true,
      message: "Database successfully re-seeded with AQUA-LENS baseline WASH dataset.",
      result,
    });
  } catch (error: any) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database: " + error.message },
      { status: 500 }
    );
  }
}
