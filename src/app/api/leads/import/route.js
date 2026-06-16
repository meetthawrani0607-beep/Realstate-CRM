/**
 * POST /api/leads/import
 *
 * Public portal webhook endpoint — authenticated by API key only.
 * Accepts leads from MagicBricks, 99acres, Facebook Ads, websites, etc.
 *
 * Flow:
 *   1. Authenticate via X-API-Key header
 *   2. Log raw request to PortalLog
 *   3. Validate & normalize payload
 *   4. Duplicate detection by phone + orgId
 *   5. Create or update lead
 *   6. Run automation engine (activity, WhatsApp, AI)
 *   7. Return structured response
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePortal, getCallerIp } from '@/lib/portalAuth';
import { validateAndNormalize } from '@/lib/leadValidator';
import { runPortalAutomation, updatePortalCounters, assignRoundRobin } from '@/lib/automationEngine';

// ─── POST /api/leads/import ───────────────────────────────────────────────────
export async function POST(req) {
  const ip = getCallerIp(req);
  let source = null;
  let orgId = null;
  let rawBody = null;

  // ── Step 1: Authenticate ────────────────────────────────────────
  try {
    const auth = await authenticatePortal(req);
    source = auth.source;
    orgId = auth.orgId;
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Unauthorized' },
      { status: err.status || 401 }
    );
  }

  // ── Step 2: Parse body ──────────────────────────────────────────
  try {
    rawBody = await req.json();
  } catch {
    await writeLog({ source, orgId, ip, rawPayload: '{}', status: 'error', errorMessage: 'Invalid JSON body' });
    return NextResponse.json(
      { status: 'error', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  // ── Step 3: Validate & normalize ───────────────────────────────
  const { data, errors } = validateAndNormalize(rawBody);

  if (errors.length > 0) {
    await writeLog({ source, orgId, ip, rawPayload: JSON.stringify(rawBody), status: 'invalid', errorMessage: errors.join('; ') });
    return NextResponse.json(
      { status: 'error', message: 'Validation failed', errors },
      { status: 422 }
    );
  }

  // Override source with the portal's registered slug if not set
  if (!data.source || data.source === 'api') {
    data.source = source.slug;
  }

  // ── Step 4: Duplicate detection (phone + orgId) ─────────────────
  const existing = await prisma.lead.findFirst({
    where: { phone: data.phone, orgId },
  });

  let lead;
  let isNew;
  let action;

  if (existing) {
    // ── Step 5a: Update existing lead ───────────────────────────
    isNew = false;
    action = 'updated';

    // Only update fields that are present in new payload and not overwriting richer existing data
    const updateData = {
      // Update source if it's more specific
      source: data.source || existing.source,
      sourcePortalId: source.id,
      // Update budget only if new value is provided
      ...(data.budget && { budget: data.budget }),
      ...(data.budgetMax && { budgetMax: data.budgetMax }),
      // Update optional fields if missing from existing
      ...(data.email && !existing.email && { email: data.email }),
      ...(data.propertyType && !existing.propertyType && { propertyType: data.propertyType }),
      ...(data.city && !existing.city && { city: data.city }),
      ...(data.locality && !existing.locality && { locality: data.locality }),
      // Append to notes rather than overwrite
      ...(data.notes && {
        notes: existing.notes
          ? `${existing.notes}\n\n[${source.slug} update]: ${data.notes}`
          : data.notes,
      }),
      rawPayload: JSON.stringify(rawBody),
      updatedAt: new Date(),
    };

    lead = await prisma.lead.update({
      where: { id: existing.id },
      data: updateData,
    });

    await writeLog({ source, orgId, ip, rawPayload: JSON.stringify(rawBody), status: 'duplicate', action, leadId: lead.id });

  } else {
    // ── Step 5b: Create new lead ─────────────────────────────────
    isNew = true;
    action = 'created';

    // Round-robin agent assignment
    const agentId = await assignRoundRobin(orgId);

    try {
      lead = await prisma.lead.create({
        data: {
          ...data,
          orgId,
          assignedToId: agentId,
          sourcePortalId: source.id,
          rawPayload: JSON.stringify(rawBody),
        },
      });
      await writeLog({ source, orgId, ip, rawPayload: JSON.stringify(rawBody), status: 'success', action, leadId: lead.id });
    } catch (err) {
      if (err.code === 'P2002') {
        // Race condition: another request created it between our findFirst and create
        return NextResponse.json(
          { status: 'success', action: 'duplicate_concurrent', message: 'Lead is being processed by another concurrent request.' },
          { status: 200 }
        );
      }
      throw err;
    }
  }

  // ── Step 6: Automation engine (non-blocking for WhatsApp + AI) ──
  runPortalAutomation(lead, orgId, source.slug, isNew).catch(err => {
    console.error('[Import] Automation error:', err.message);
  });

  // Update portal counters
  updatePortalCounters(source.id).catch(() => {});

  // ── Step 7: Response ─────────────────────────────────────────────
  return NextResponse.json(
    {
      status: 'success',
      action,
      leadId: lead.id,
      message: isNew
        ? `Lead created and assigned to agent. WhatsApp response queued.`
        : `Existing lead updated. Activity logged.`,
      data: {
        name: lead.name,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
      },
    },
    { status: isNew ? 201 : 200 }
  );
}

// ─── Helper: write PortalLog entry ───────────────────────────────────────────
async function writeLog({ source, orgId, ip, rawPayload, status, action = null, leadId = null, errorMessage = null }) {
  try {
    await prisma.portalLog.create({
      data: {
        sourceSlug: source.slug,
        rawPayload,
        status,
        action,
        errorMessage,
        ip,
        orgId,
        leadId,
      },
    });
  } catch (err) {
    // Never let logging failures break the main flow
    console.error('[Import] PortalLog write failed:', err.message);
  }
}
