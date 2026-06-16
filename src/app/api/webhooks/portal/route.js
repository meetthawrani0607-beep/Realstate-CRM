import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { executeCustomAutomations } from '@/lib/automationEngine';

// Generic Webhook Ingestion for Third-Party Portals (e.g. Zillow, 99acres)
// Expected to be called with POST /api/webhooks/portal?orgId=123
export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return NextResponse.json({ error: 'Invalid orgId' }, { status: 404 });
    }

    const body = await req.json();

    // Map common portal formats to our DB schema
    // Assume body might have different shapes depending on the portal
    const name = body.name || body.fullName || body.contactName || 'Portal Lead';
    const email = body.email || body.contactEmail || null;
    const phone = body.phone || body.contactPhone || null;
    const budget = body.budget ? parseInt(body.budget, 10) : null;
    const source = body.source || body.portalName || 'external_portal';
    const notes = body.notes || body.message || body.comments || '';

    const newLead = await prisma.lead.create({
      data: {
        orgId,
        name,
        email,
        phone,
        budget,
        source: source.toLowerCase(),
        status: 'new',
        notes: `Imported via webhook from ${source}.\n${notes}`,
      }
    });

    // Trigger Automations async
    executeCustomAutomations(orgId, 'LEAD_CREATED', { lead: newLead }).catch(console.error);

    return NextResponse.json({ success: true, leadId: newLead.id }, { status: 201 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
