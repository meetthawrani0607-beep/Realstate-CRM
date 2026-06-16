import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { executeCustomAutomations } from '@/lib/automationEngine';

// Helper to build an absolute redirect URL
function buildRedirectUrl(req, path) {
  try {
    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    return `${proto}://${host}${path}`;
  } catch {
    return `http://localhost:3000${path}`;
  }
}

// Handles form submissions from the public Property Showcase page
export async function POST(req) {
  let propertyId = null;
  
  try {
    const formData = await req.formData();
    const orgId = formData.get('orgId');
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    propertyId = formData.get('propertyId');
    const source = formData.get('source') || 'Showcase Page';

    if (!orgId || !name || !phone) {
      const redirectUrl = buildRedirectUrl(req, `/showcase/${propertyId}?error=missing_fields`);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    // Verify the org exists
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      const redirectUrl = buildRedirectUrl(req, `/showcase/${propertyId}?error=invalid_org`);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    // Use upsert to handle duplicate phone+org constraint gracefully
    const newLead = await prisma.lead.upsert({
      where: {
        orgId_phone: { orgId, phone }
      },
      update: {
        // If lead already exists, just update notes to indicate re-inquiry
        notes: propertyId
          ? `Re-inquired about property ID: ${propertyId} (via Showcase)`
          : 'Re-inquiry from showcase page',
        updatedAt: new Date(),
      },
      create: {
        orgId,
        name,
        email: email || null,
        phone,
        source: source.toLowerCase(),
        status: 'new',
        notes: propertyId ? `Inquired about property ID: ${propertyId}` : 'Inquiry from showcase',
      }
    });

    // Trigger Automations async (fire-and-forget)
    executeCustomAutomations(orgId, 'LEAD_CREATED', { lead: newLead }).catch(console.error);

    const redirectUrl = buildRedirectUrl(req, `/showcase/${propertyId}?success=true`);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    console.error('Showcase Webhook Error:', error);
    const fallbackPath = propertyId ? `/showcase/${propertyId}?error=server_error` : '/';
    const redirectUrl = buildRedirectUrl(req, fallbackPath);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
