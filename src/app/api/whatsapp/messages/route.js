import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('leadId');
  if (!leadId) return NextResponse.json({ messages: [] });

  const messages = await prisma.message.findMany({
    where: { leadId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ messages });
}
