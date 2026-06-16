/**
 * GET    /api/portals/[id]   — Portal detail + recent logs
 * PATCH  /api/portals/[id]   — Toggle active, update name/description
 * DELETE /api/portals/[id]   — Deactivate (soft delete)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const source = await prisma.portalSource.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
  });
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [logs, stats] = await Promise.all([
    prisma.portalLog.findMany({
      where: { orgId: session.user.orgId, sourceSlug: source.slug },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { lead: { select: { id: true, name: true, phone: true } } },
    }),
    // 7-day trend
    prisma.$queryRaw`
      SELECT
        date(createdAt) as day,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as created,
        SUM(CASE WHEN status = 'duplicate' THEN 1 ELSE 0 END) as duplicates
      FROM PortalLog
      WHERE orgId = ${session.user.orgId}
        AND sourceSlug = ${source.slug}
        AND createdAt >= datetime('now', '-7 days')
      GROUP BY date(createdAt)
      ORDER BY day ASC
    `,
  ]);

  return NextResponse.json({ source, logs, trend: stats });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.portalSource.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const allowed = {};
  if (typeof body.isActive === 'boolean') allowed.isActive = body.isActive;
  if (body.name) allowed.name = body.name.trim();
  if (body.description !== undefined) allowed.description = body.description?.trim() || null;

  const source = await prisma.portalSource.update({
    where: { id: params.id },
    data: allowed,
  });

  return NextResponse.json({ source });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.portalSource.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Soft delete — deactivate only
  await prisma.portalSource.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, message: 'Portal deactivated' });
}
