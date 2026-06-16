import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { executeCustomAutomations } from '@/lib/automationEngine';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  if (!lead || lead.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const activities = await prisma.activity.findMany({
    where: { leadId: params.id }, orderBy: { createdAt: 'desc' }, take: 50,
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({ lead, activities });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing || existing.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Prevent Mass Assignment: explicitly filter allowed fields
  const allowedFields = ['name', 'phone', 'email', 'budget', 'budgetMax', 'propertyType', 'source', 'status', 'city', 'locality', 'notes', 'tags', 'assignedToId'];
  const updateData = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  // Ensure they cannot assign a user outside their org
  if (updateData.assignedToId) {
    const userExists = await prisma.user.findFirst({ where: { id: updateData.assignedToId, orgId: session.user.orgId } });
    if (!userExists) return NextResponse.json({ error: 'Invalid user assignment' }, { status: 400 });
  }

  const lead = await prisma.lead.update({ where: { id: params.id }, data: updateData });

  if (body.status && body.status !== existing.status) {
    await prisma.activity.create({
      data: { type: 'status_change', title: `Status changed to ${body.status}`, leadId: params.id, userId: session.user.id },
    });
    executeCustomAutomations(lead, 'status_change').catch(err => {
      console.error('Failed to execute automations for status change', err);
    });
  }

  return NextResponse.json({ lead });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing || existing.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
