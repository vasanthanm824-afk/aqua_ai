import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasPermission } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, "canUpdateInterventions")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.intervention.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
    }

    // Append to audit log
    let history: any[] = [];
    try {
      history = existing.auditLogJson ? JSON.parse(existing.auditLogJson) : [];
    } catch {
      history = [];
    }

    history.push({
      action: body.status && body.status !== existing.status ? `STATUS_CHANGE_TO_${body.status}` : "UPDATED",
      user: session.name,
      timestamp: new Date().toISOString(),
      changes: body,
    });

    const updated = await prisma.intervention.update({
      where: { id },
      data: {
        ...body,
        auditLogJson: JSON.stringify(history),
      },
      include: {
        community: true,
        assignedOfficer: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UPDATE",
        entityType: "Intervention",
        entityId: updated.id,
        detailsJson: JSON.stringify({ oldStatus: existing.status, newStatus: updated.status }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
