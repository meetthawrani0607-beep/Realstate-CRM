import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { executeCustomAutomations } from '@/lib/automationEngine';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const search = searchParams.get('search');
  const assignedToId = searchParams.get('assignedToId');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where = { orgId: session.user.orgId };
  if (status) where.status = status;
  if (source) where.source = source;
  if (assignedToId) where.assignedToId = assignedToId;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where, orderBy: { createdAt: 'desc' }, take: limit,
    select: {
      id: true, name: true, phone: true, email: true, budget: true, budgetMax: true,
      propertyType: true, source: true, sourcePortalId: true, status: true, score: true,
      aiScore: true, aiNotes: true, notes: true, tags: true, city: true, locality: true,
      createdAt: true, updatedAt: true, orgId: true, assignedToId: true,
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ leads });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const lead = await prisma.lead.create({
    data: {
      name: body.name, phone: body.phone, email: body.email || null,
      budget: body.budget || null, budgetMax: body.budgetMax || null,
      propertyType: body.propertyType || null, source: body.source || 'website',
      status: body.status || 'new', city: body.city || null, locality: body.locality || null,
      notes: body.notes || null, orgId: session.user.orgId, assignedToId: session.user.id,
    },
  });

  // Create system activity
  await prisma.activity.create({
    data: { type: 'system', title: 'Lead created', leadId: lead.id, userId: session.user.id },
  });

  // Execute custom automations asynchronously
  executeCustomAutomations(lead, 'new_lead').catch(err => {
    console.error('Failed to execute automations for new lead', err);
  });

  return NextResponse.json({ lead }, { status: 201 });
}
