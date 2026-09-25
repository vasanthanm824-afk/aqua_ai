import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let user: any = null;

    // 1. Try finding by session ID
    if (session.id) {
      try {
        user = await prisma.user.findUnique({
          where: { id: session.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
            avatarUrl: true,
          },
        });
      } catch (e) {}
    }

    // 2. Try finding by email if ID lookup returned null
    if (!user && session.email) {
      try {
        user = await prisma.user.findUnique({
          where: { email: session.email.toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
            avatarUrl: true,
          },
        });
      } catch (e) {}
    }

    // 3. Fallback to valid signed session payload if DB record is not present
    const finalUser = user || {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      organizationId: session.organizationId,
    };

    return NextResponse.json({
      authenticated: true,
      user: finalUser,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}

