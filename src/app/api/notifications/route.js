import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = session.user.orgId;

    // Fetch recent activities across all leads for this organization
    const recentActivities = await prisma.activity.findMany({
      where: {
        lead: {
          orgId: orgId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        lead: {
          select: { name: true, id: true }
        }
      }
    });

    const notifications = recentActivities.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      time: a.createdAt,
      leadName: a.lead?.name,
      leadId: a.lead?.id
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('[Notifications API Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
