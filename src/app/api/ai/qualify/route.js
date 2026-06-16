import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { qualifyLead } from '@/lib/ai';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId } = await req.json();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const activities = await prisma.activity.findMany({
    where: { leadId }, orderBy: { createdAt: 'desc' }, take: 20,
  });

  const properties = await prisma.property.findMany({
    where: { orgId: lead.orgId, availability: 'available' },
    select: { id: true, title: true, type: true, price: true, locality: true, city: true },
    take: 50
  });

  const result = await qualifyLead(lead, activities, properties);

  // Update lead with AI score
  await prisma.lead.update({
    where: { id: leadId },
    data: { aiScore: result.score, aiNotes: result.reason },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: 'system', title: `AI scored lead as ${result.score.toUpperCase()}`,
      content: result.reason, leadId, userId: session.user.id,
    },
  });

  return NextResponse.json(result);
}
