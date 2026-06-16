import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — WhatsApp webhook verification (required by Meta)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST — Receive incoming WhatsApp messages
export async function POST(req) {
  const body = await req.json();

  // Extract messages from webhook payload
  const entries = body?.entry || [];
  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      const messages = change?.value?.messages || [];
      for (const msg of messages) {
        const phone = msg.from; // sender phone
        const text = msg.text?.body || msg.caption || '';
        const waMessageId = msg.id;

        if (!text) continue;

        // Find lead by phone number
        const normalizedPhone = phone.replace(/^91/, '');
        const lead = await prisma.lead.findFirst({
          where: {
            OR: [
              { phone: { contains: normalizedPhone } },
              { phone: { contains: phone } },
            ],
          },
        });

        if (lead) {
          // Store inbound message
          await prisma.message.create({
            data: {
              direction: 'inbound', type: 'text', content: text,
              status: 'read', waMessageId, leadId: lead.id,
            },
          });

          // Log activity
          await prisma.activity.create({
            data: {
              type: 'whatsapp', title: 'WhatsApp message received',
              content: text.length > 100 ? text.substring(0, 100) + '...' : text,
              leadId: lead.id,
            },
          });
        } else {
          console.log(`[Webhook] No lead found for phone: ${phone}`);
        }
      }
    }
  }

  return NextResponse.json({ status: 'ok' });
}
