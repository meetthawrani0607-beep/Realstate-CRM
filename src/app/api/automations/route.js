import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const automations = await prisma.automation.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ automations });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, trigger, actions, conditions } = body;

  if (!name || !trigger || !actions) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const automation = await prisma.automation.create({
    data: {
      name,
      trigger,
      actions: typeof actions === 'string' ? actions : JSON.stringify(actions),
      conditions: conditions ? JSON.stringify(conditions) : null,
      orgId: session.user.orgId,
    },
  });

  return NextResponse.json(automation, { status: 201 });
}
