/**
 * GET /api/portals/stats
 * Org-wide portal analytics: per-source breakdown, lead trends, conversion metrics.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.user.orgId;
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalSources,
    activeSources,
    todayLogs,
    weekLogs,
    totalLogs,
    successLogs,
    duplicateLogs,
    errorLogs,
    perSource,
    recentLogs,
  ] = await Promise.all([
    prisma.portalSource.count({ where: { orgId } }),
    prisma.portalSource.count({ where: { orgId, isActive: true } }),
    prisma.portalLog.count({ where: { orgId, createdAt: { gte: todayStart } } }),
    prisma.portalLog.count({ where: { orgId, createdAt: { gte: weekStart } } }),
    prisma.portalLog.count({ where: { orgId } }),
    prisma.portalLog.count({ where: { orgId, status: 'success' } }),
    prisma.portalLog.count({ where: { orgId, status: 'duplicate' } }),
    prisma.portalLog.count({ where: { orgId, status: { in: ['error', 'invalid'] } } }),

    // Per-source breakdown
    prisma.portalSource.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        totalLeads: true,
        lastLeadAt: true,
      },
      orderBy: { totalLeads: 'desc' },
    }),

    // Last 20 request logs across all sources
    prisma.portalLog.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        sourceSlug: true,
        status: true,
        action: true,
        errorMessage: true,
        ip: true,
        createdAt: true,
        leadId: true,
        lead: { select: { name: true, phone: true } },
      },
    }),
  ]);

  const duplicateRate = totalLogs > 0 ? Math.round((duplicateLogs / totalLogs) * 100) : 0;
  const successRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0;
  const errorRate = totalLogs > 0 ? Math.round((errorLogs / totalLogs) * 100) : 0;

  return NextResponse.json({
    overview: {
      totalSources,
      activeSources,
      todayLeads: todayLogs,
      weekLeads: weekLogs,
      totalRequests: totalLogs,
      successRate,
      duplicateRate,
      errorRate,
    },
    perSource,
    recentLogs,
  });
}
