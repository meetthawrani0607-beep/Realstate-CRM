/**
 * AI Lead Qualification — lightweight prompt-based scoring
 * Uses OpenAI if available, otherwise falls back to rule-based scoring
 */

const QUALIFICATION_PROMPT = `You are a real estate lead qualification AI.
Analyze the following lead data alongside the organization's current active property inventory.
Classify the lead as HOT, WARM, or COLD.

Rules:
- HOT: Has budget, specific property preference, actively engaged (multiple interactions), ready to visit, AND matches well with at least 1 active property in inventory.
- WARM: Showed interest, has partial requirements, some engagement, or matches an active property loosely.
- COLD: Minimal info, no engagement, just browsing, unclear intent, or budget is completely unaligned with inventory.

You must also provide a personalized reason which suggests 1 or 2 specific properties from the inventory if they are a good match, to help the agent know what to pitch.

Respond with a JSON object only:
{
  "score": "hot" | "warm" | "cold",
  "reason": "Brief explanation including suggested property matches if any (max 3 sentences)",
  "confidence": 0.0 to 1.0
}`;

/**
 * Qualify a lead using AI or rule-based fallback
 */
export async function qualifyLead(lead, activities = [], properties = []) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Build lead context
  const context = {
    lead: {
      name: lead.name,
      phone: lead.phone,
      budget: lead.budget,
      budgetMax: lead.budgetMax,
      propertyType: lead.propertyType,
      source: lead.source,
      city: lead.city,
      locality: lead.locality,
      activityCount: activities.length,
      activityTypes: [...new Set(activities.map((a) => a.type))],
      lastActivity: activities[0]?.createdAt || null,
      daysSinceCreation: Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000),
      notes: lead.notes,
    },
    active_inventory: properties
  };

  // Try OpenAI first
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: QUALIFICATION_PROMPT },
            { role: 'user', content: JSON.stringify(context) },
          ],
          temperature: 0.3,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const result = JSON.parse(data.choices[0].message.content);
        return {
          score: result.score,
          reason: result.reason,
          confidence: result.confidence,
          method: 'ai',
        };
      }
    } catch (err) {
      console.warn('[AI] OpenAI call failed, using fallback:', err.message);
    }
  }

  // Rule-based fallback
  return ruleBasedQualification(context.lead, properties);
}

/**
 * Simple rule-based lead scoring fallback
 */
function ruleBasedQualification(ctx, properties) {
  let score = 0;
  const reasons = [];
  const matches = [];

  // Property matching logic
  if (properties && properties.length > 0) {
    for (const p of properties) {
      let isMatch = true;
      if (ctx.propertyType && p.type !== ctx.propertyType) isMatch = false;
      if (ctx.budget && p.price > ctx.budget * 1.2) isMatch = false; // Allow 20% over budget
      if (ctx.locality && p.locality?.toLowerCase() !== ctx.locality.toLowerCase()) isMatch = false;
      
      if (isMatch && (ctx.propertyType || ctx.budget || ctx.locality)) {
        matches.push(p.title);
      }
    }
  }

  if (matches.length > 0) {
    score += 30;
    reasons.push(`Matches ${matches.length} active properties (e.g. ${matches[0]})`);
  }

  // Budget specified
  if (ctx.budget) { score += 20; reasons.push('Budget specified'); }

  // Property type specified
  if (ctx.propertyType) { score += 15; reasons.push('Property preference set'); }

  // Location specified
  if (ctx.locality) { score += 10; reasons.push('Location preference set'); }

  // Activity engagement
  if (ctx.activityCount >= 5) { score += 25; reasons.push('High engagement'); }
  else if (ctx.activityCount >= 2) { score += 15; reasons.push('Some engagement'); }
  else if (ctx.activityCount >= 1) { score += 5; }

  // Source quality
  if (['referral', 'walkin'].includes(ctx.source)) { score += 15; reasons.push('High-intent source'); }
  else if (['99acres', 'magicbricks'].includes(ctx.source)) { score += 10; }

  // Recency
  if (ctx.daysSinceCreation <= 3) { score += 10; reasons.push('Recent lead'); }
  else if (ctx.daysSinceCreation > 30) { score -= 10; reasons.push('Aging lead'); }

  // Classify
  let classification, confidence;
  if (score >= 70) { classification = 'hot'; confidence = Math.min(0.9, score / 100); }
  else if (score >= 35) { classification = 'warm'; confidence = 0.6; }
  else { classification = 'cold'; confidence = 0.5; }

  return {
    score: classification,
    reason: reasons.slice(0, 3).join('. ') || 'Insufficient data for scoring',
    confidence,
    method: 'rules',
  };
}
