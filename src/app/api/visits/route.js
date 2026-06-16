import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const visits = await prisma.siteVisit.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { date: 'asc' },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      property: { select: { id: true, title: true, location: true } },
      agent: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ visits });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const visit = await prisma.siteVisit.create({
    data: {
      date: new Date(body.date), time: body.time,
      notes: body.notes || null, status: 'scheduled',
      leadId: body.leadId, propertyId: body.propertyId,
      agentId: session.user.id, orgId: session.user.orgId,
    },
  });

  // Update lead status
  await prisma.lead.update({ where: { id: body.leadId }, data: { status: 'visit_scheduled' } });

  // Log activity
  await prisma.activity.create({
    data: { type: 'visit', title: 'Site visit scheduled', content: `${body.date} at ${body.time}`, leadId: body.leadId, userId: session.user.id },
  });

  return NextResponse.json({ visit }, { status: 201 });
}
