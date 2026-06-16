import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { LEAD_STATUSES } from '@/lib/utils';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.user.orgId;

  // Time-based
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const monthAgo = new Date(Date.now() - 30 * 86400000);

  // Group queries into smaller batches to prevent SQLite "database is locked" timeout errors
  const [totalLeads, closedWon, closedLost, activeDeals, newToday] = await Promise.all([
    prisma.lead.count({ where: { orgId } }),
    prisma.lead.count({ where: { orgId, status: 'closed_won' } }),
    prisma.lead.count({ where: { orgId, status: 'closed_lost' } }),
    prisma.lead.count({ where: { orgId, status: { in: ['qualified', 'visit_scheduled', 'negotiation'] } } }),
    prisma.lead.count({ where: { orgId, createdAt: { gte: todayStart } } })
  ]);

  const [newThisWeek, newThisMonth, visitsThisWeek, completedVisits, totalProperties] = await Promise.all([
    prisma.lead.count({ where: { orgId, createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { orgId, createdAt: { gte: monthAgo } } }),
    prisma.siteVisit.count({ where: { orgId, date: { gte: weekAgo }, status: { in: ['scheduled', 'confirmed'] } } }),
    prisma.siteVisit.count({ where: { orgId, status: 'completed' } }),
    prisma.property.count({ where: { orgId } })
  ]);

  const [revenueResult, pipelineResult, sourceGroups, pipelineGroups, recentLeads] = await Promise.all([
    prisma.lead.aggregate({ _sum: { budget: true }, where: { orgId, status: 'closed_won' } }),
    prisma.lead.aggregate({ _sum: { budget: true }, where: { orgId, status: { in: ['qualified', 'visit_scheduled', 'negotiation'] } } }),
    prisma.lead.groupBy({ by: ['source'], _count: { source: true }, where: { orgId } }),
    prisma.lead.groupBy({ by: ['status'], _count: { status: true }, where: { orgId } }),
    prisma.lead.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, name: true, phone: true, email: true, budget: true, budgetMax: true,
        propertyType: true, source: true, status: true, score: true, aiScore: true,
        notes: true, city: true, locality: true, createdAt: true, updatedAt: true,
        assignedTo: { select: { name: true } },
      },
    })
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;
  const revenue = revenueResult._sum.budget || 0;
  const pipelineValue = pipelineResult._sum.budget || 0;

  // Map Source Groups
  const sources = sourceGroups
    .map(g => ({ source: g.source || 'unknown', count: g._count.source }))
    .sort((a, b) => b.count - a.count);

  // Map Pipeline Groups
  const statusMap = Object.fromEntries(pipelineGroups.map(g => [g.status, g._count.status]));
  const pipeline = LEAD_STATUSES
    .filter(s => s.value !== 'closed_lost')
    .map(s => ({
      label: s.label,
      value: s.value,
      color: s.color,
      count: statusMap[s.value] || 0
    }));

  // Agent Leaderboard (Only for Agencies)
  let leaderboard = [];
  if (session.user.accountType === 'agency' || session.user.accountType === 'company') {
    const agents = await prisma.user.findMany({
      where: { orgId, role: { not: 'admin' } },
      select: { id: true, name: true }
    });
    
    // Optimizing leaderboard queries to avoid N+1 and SQLite connection saturation
    const [assignedCounts, wonCounts] = await Promise.all([
      prisma.lead.groupBy({
        by: ['assignedToId'],
        _count: { assignedToId: true },
        where: { orgId, assignedToId: { not: null } }
      }),
      prisma.lead.groupBy({
        by: ['assignedToId'],
        _count: { assignedToId: true },
        where: { orgId, assignedToId: { not: null }, status: 'closed_won' }
      })
    ]);

    const assignedMap = Object.fromEntries(assignedCounts.map(a => [a.assignedToId, a._count.assignedToId]));
    const wonMap = Object.fromEntries(wonCounts.map(w => [w.assignedToId, w._count.assignedToId]));

    const agentStats = agents.map(agent => ({
      name: agent.name,
      assigned: assignedMap[agent.id] || 0,
      won: wonMap[agent.id] || 0
    }));

    leaderboard = agentStats.sort((a, b) => b.won - a.won || b.assigned - a.assigned);
  }

  // Mock historical revenue data for charting
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const historicalRevenue = months.map((m, i) => ({
    name: m,
    revenue: Math.floor(Math.random() * 50000000) + (revenue / 2),
    pipeline: Math.floor(Math.random() * 80000000) + pipelineValue
  }));

  // Force the current month to be somewhat accurate
  historicalRevenue[5].revenue = revenue;
  historicalRevenue[5].pipeline = pipelineValue;

  return NextResponse.json({
    totalLeads, closedWon, closedLost, conversionRate, activeDeals,
    newToday, newThisWeek, newThisMonth,
    visitsThisWeek, completedVisits,
    revenue, pipelineValue, pipeline,
    sources, recentLeads, totalProperties,
    leaderboard, historicalRevenue
  }, {
    // Basic cache headers to prevent pounding
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
    }
  });
}
