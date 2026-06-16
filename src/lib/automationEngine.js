/**
 * Automation Engine
 * Runs post-lead-creation automations: assignment, activity log,
 * WhatsApp auto-response, and AI classification.
 * All operations are fire-and-forget except assignment (synchronous).
 */

import prisma from './prisma';
import { sendWhatsAppMessage } from './whatsapp';
import { qualifyLead } from './ai';

// ─── A. Round-Robin Agent Assignment ─────────────────────────────────────────

/**
 * Assign lead to the agent with fewest current active leads (round-robin by load).
 * Returns the assigned agent ID or null if no agents found.
 */
export async function assignRoundRobin(orgId) {
  // Get all agents in the org
  const agents = await prisma.user.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      _count: { select: { assignedLeads: true } },
    },
    orderBy: { assignedLeads: { _count: 'asc' } },
  });

  if (!agents.length) return null;

  // Pick least-loaded agent
  return agents[0].id;
}

// ─── B. Activity Logger ───────────────────────────────────────────────────────

async function logActivity(leadId, type, title, content = null, metadata = null) {
  try {
    await prisma.activity.create({
      data: {
        leadId,
        type,
        title,
        content: content || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error('[Automation] Activity log failed:', err.message);
  }
}

// ─── C. WhatsApp Auto-Response ────────────────────────────────────────────────

const AUTO_RESPONSE_TEMPLATE = (name, propertyInterest) => {
  const interest = propertyInterest
    ? ` in ${propertyInterest}`
    : '';
  return `Hi ${name}! 👋\n\nThank you for your interest${interest}. We've received your enquiry and one of our property advisors will contact you within 24 hours.\n\nFeel free to reply to this message with any questions!\n\n— PropCRM Team 🏠`;
};

async function sendAutoWhatsApp(lead) {
  try {
    const message = AUTO_RESPONSE_TEMPLATE(
      lead.name,
      lead.propertyType || lead.locality
    );

    const result = await sendWhatsAppMessage(lead.phone, message);

    // Log the outbound message regardless of delivery
    await prisma.message.create({
      data: {
        leadId: lead.id,
        direction: 'outbound',
        type: 'text',
        content: message,
        status: result.success ? 'sent' : 'failed',
        waMessageId: result.messageId || null,
      },
    });

    if (result.success) {
      await logActivity(lead.id, 'whatsapp', 'Auto-response sent via WhatsApp', message);
    }

    return result;
  } catch (err) {
    console.error('[Automation] WhatsApp auto-response failed:', err.message);
    return { success: false };
  }
}

// ─── D. AI Classification ─────────────────────────────────────────────────────

async function classifyLead(lead) {
  try {
    const result = await qualifyLead(lead, []);

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        aiScore: result.score,
        aiNotes: result.reason,
      },
    });

    await logActivity(
      lead.id,
      'system',
      `AI scored as ${result.score.toUpperCase()}`,
      result.reason,
      { method: result.method, confidence: result.confidence }
    );
  } catch (err) {
    console.error('[Automation] AI classification failed:', err.message);
  }
}

// ─── E. Custom Automations ──────────────────────────────────────────────────────

export async function executeCustomAutomations(lead, trigger) {
  try {
    const automations = await prisma.automation.findMany({
      where: { orgId: lead.orgId, isActive: true, trigger }
    });

    for (const auto of automations) {
      const actions = JSON.parse(auto.actions || '[]');
      
      for (const action of actions) {
        if (action === 'assign_agent') {
          // Check if org is an agency to allow round-robin
          const org = await prisma.organization.findUnique({ where: { id: lead.orgId }});
          if (org.accountType === 'agency') {
             const agentId = await assignRoundRobin(lead.orgId);
             if (agentId && agentId !== lead.assignedToId) {
                await prisma.lead.update({ where: { id: lead.id }, data: { assignedToId: agentId } });
                await logActivity(lead.id, 'system', `Assigned to new agent via automation: ${auto.name}`);
             }
          }
        }
        else if (action === 'send_whatsapp') {
          await sendAutoWhatsApp(lead);
        }
        else if (action === 'notify') {
          await logActivity(lead.id, 'task', `Notification triggered by automation: ${auto.name}`);
        }
        else if (action === 'send_email') {
          await logActivity(lead.id, 'email', `Email triggered by automation: ${auto.name}`);
        }
      }
    }
  } catch (err) {
    console.error('[Automation] Custom automations failed:', err.message);
  }
}

// ─── Main Automation Runner ───────────────────────────────────────────────────

/**
 * Run all automations for a portal-imported lead.
 *
 * @param {object} lead     - Full lead record from DB
 * @param {string} orgId    - Organization ID
 * @param {string} sourceSlug - Portal source slug (e.g. "magicbricks")
 * @param {boolean} isNew   - true = newly created, false = duplicate update
 */
export async function runPortalAutomation(lead, orgId, sourceSlug, isNew) {
  const sourceName = sourceSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // B. Activity log (synchronous — must complete before response)
  const activityTitle = isNew
    ? `Lead imported from ${sourceName}`
    : `Lead updated from ${sourceName}`;

  await logActivity(
    lead.id,
    'system',
    activityTitle,
    isNew
      ? `New lead created via ${sourceName} portal integration`
      : `Existing lead refreshed with updated data from ${sourceName}`,
    { source: sourceSlug, isNew }
  );

  // C, D — fire and forget (don't block the API response)
  Promise.all([
    isNew ? executeCustomAutomations(lead, 'new_lead') : Promise.resolve(),
    isNew ? classifyLead(lead) : Promise.resolve(),
  ]).catch(err => {
    console.error('[Automation] Background tasks error:', err.message);
  });
}

/**
 * Update PortalSource counters after a successful lead ingestion.
 */
export async function updatePortalCounters(sourceId) {
  try {
    await prisma.portalSource.update({
      where: { id: sourceId },
      data: {
        totalLeads: { increment: 1 },
        lastLeadAt: new Date(),
      },
    });
  } catch (err) {
    console.error('[Automation] Counter update failed:', err.message);
  }
}
