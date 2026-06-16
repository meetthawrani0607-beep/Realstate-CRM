import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = session.user.orgId;

    // Fetch Hot Leads (highest budget, status 'new' or 'contacted')
    const hotLeadsRaw = await prisma.lead.findMany({
      where: {
        orgId,
        status: { in: ['new', 'contacted', 'qualified'] },
        budgetMax: { not: null }
      },
      orderBy: { budgetMax: 'desc' },
      take: 2,
    });

    const suggestions = hotLeadsRaw.map(lead => ({
      name: lead.name,
      detail: `Hot lead · ${lead.budgetMax ? formatCurrency(lead.budgetMax) + ' budget' : 'High intent'}`,
      type: 'hot',
      id: lead.id
    }));

    // Find a lead needing follow-up
    const staleLead = await prisma.lead.findFirst({
      where: {
        orgId,
        status: 'contacted',
        updatedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // older than 3 days
      },
      orderBy: { updatedAt: 'asc' }
    });

    if (staleLead) {
      suggestions.push({
        name: staleLead.name,
        detail: 'No contact in 3+ days',
        type: 'followup',
        id: staleLead.id
      });
    }

    // Followups / Insights
    // 1. Visits this week
    const visitsCount = await prisma.siteVisit.count({
      where: {
        lead: { orgId },
        status: 'scheduled',
        date: { gte: new Date() }
      }
    });

    // 2. Leads needing follow up today (new leads)
    const newLeadsCount = await prisma.lead.count({
      where: { orgId, status: 'new' }
    });

    // 3. Pipeline value (sum of qualified/negotiation budgets)
    const pipelineAggr = await prisma.lead.aggregate({
      where: { orgId, status: { in: ['qualified', 'negotiation'] } },
      _sum: { budgetMax: true }
    });
    const pipelineValue = pipelineAggr._sum.budgetMax || 0;

    const followups = [
      { icon: 'CalendarDays', text: `${visitsCount} site visits scheduled coming up` },
      { icon: 'Bell', text: `${newLeadsCount} new leads need follow-up today` },
      { icon: 'BarChart3', text: `Pipeline value: ${formatCurrency(pipelineValue)}` },
    ];

    return NextResponse.json({ suggestions, followups });

  } catch (error) {
    console.error('[AI Insights API Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}
