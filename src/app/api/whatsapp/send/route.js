import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId, phone, message } = await req.json();
  if (!leadId || !message) {
    return NextResponse.json({ error: 'leadId and message are required' }, { status: 400 });
  }

  // Store outbound message in DB
  const msg = await prisma.message.create({
    data: {
      direction: 'outbound',
      type: 'text',
      content: message,
      status: 'sent',
      leadId,
      userId: session.user.id,
    },
  });

  // Log activity on lead timeline
  await prisma.activity.create({
    data: {
      type: 'whatsapp',
      title: 'WhatsApp message sent',
      content: message.length > 100 ? message.substring(0, 100) + '...' : message,
      leadId,
      userId: session.user.id,
    },
  });

  // If lead is still "new", auto-update to "contacted"
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (lead && lead.status === 'new') {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'contacted' },
    });
    await prisma.activity.create({
      data: {
        type: 'system',
        title: 'Status auto-updated to Contacted',
        content: 'First message sent via WhatsApp',
        leadId,
        userId: session.user.id,
      },
    });
  }

  // Attempt real WhatsApp delivery (non-blocking)
  let waResult = { delivered: false };
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && phone) {
    try {
      const { sendWhatsAppMessage } = await import('@/lib/whatsapp');
      const result = await sendWhatsAppMessage(phone, message);
      if (result.success) {
        await prisma.message.update({
          where: { id: msg.id },
          data: { status: 'delivered', waMessageId: result.messageId },
        });
        waResult = { delivered: true, messageId: result.messageId };
      }
    } catch (err) {
      console.error('[WhatsApp] Send error:', err);
    }
  }

  return NextResponse.json({
    message: { ...msg, status: waResult.delivered ? 'delivered' : 'sent' },
    whatsapp: waResult,
  });
}
