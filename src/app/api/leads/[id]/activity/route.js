import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const activity = await prisma.activity.create({
    data: {
      type: body.type || 'note',
      title: body.title || 'Note added',
      content: body.content || null,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      leadId: params.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ activity }, { status: 201 });
}
