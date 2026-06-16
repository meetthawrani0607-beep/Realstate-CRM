import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Simulate an incoming WhatsApp message from a lead (for demo/testing)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId, message } = await req.json();
  if (!leadId || !message) {
    return NextResponse.json({ error: 'leadId and message are required' }, { status: 400 });
  }

  // Create inbound message
  const msg = await prisma.message.create({
    data: {
      direction: 'inbound',
      type: 'text',
      content: message,
      status: 'read',
      leadId,
    },
  });

  // Log activity on lead timeline
  await prisma.activity.create({
    data: {
      type: 'whatsapp',
      title: 'WhatsApp message received',
      content: message,
      leadId,
    },
  });

  return NextResponse.json({ message: msg });
}
