import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  const orgId = session.user.orgId;

  // Gather CRM context for intelligent responses
  const [totalLeads, activeDeals, recentLeads, closedWon, properties] = await Promise.all([
    prisma.lead.count({ where: { orgId } }),
    prisma.lead.count({ where: { orgId, status: { in: ['qualified', 'visit_scheduled', 'negotiation'] } } }),
    prisma.lead.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, phone: true, status: true, budget: true, aiScore: true, source: true, createdAt: true } }),
    prisma.lead.count({ where: { orgId, status: 'closed_won' } }),
    prisma.property.count({ where: { orgId } }),
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

  // Check if OpenAI key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (apiKey) {
    // Use real OpenAI API
    try {
      const systemPrompt = `You are PropCRM AI, an intelligent assistant for a real estate CRM platform. You help agents manage leads, analyze pipelines, and optimize their sales process.

Current CRM Context:
- Total Leads: ${totalLeads}
- Active Deals: ${activeDeals}
- Conversion Rate: ${conversionRate}%
- Properties: ${properties}
- Recent Leads: ${recentLeads.map(l => `${l.name} (${l.status}, ${l.source || 'unknown'}, budget: ${l.budget ? formatCurrency(l.budget, true) : 'N/A'})`).join('; ')}

Provide actionable, specific advice based on this data. Be concise and professional.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return NextResponse.json({ reply: data.choices[0].message.content });
      }
      return NextResponse.json({ reply: 'I received an unexpected response from the AI service. Please try again.' });
    } catch (err) {
      console.error('[AI Chat] OpenAI error:', err.message);
      return NextResponse.json({ reply: 'Failed to connect to AI service. Please check your API key.' });
    }
  }

  // Fallback: intelligent rule-based responses using real CRM data
  const lower = message.toLowerCase();
  let reply = '';

  if (lower.includes('pipeline') || lower.includes('summary') || lower.includes('overview')) {
    reply = `📊 **Pipeline Summary**\n\n- Total Leads: ${totalLeads}\n- Active Deals: ${activeDeals}\n- Conversion Rate: ${conversionRate}%\n- Properties Listed: ${properties}\n- Closed Won: ${closedWon}\n\nYour pipeline has ${activeDeals} active deal${activeDeals !== 1 ? 's' : ''} in progress. ${conversionRate > 15 ? 'Your conversion rate is healthy!' : 'Consider improving follow-up cadence to boost conversions.'}`;
  } else if (lower.includes('hot') || lower.includes('priorit') || lower.includes('contact today')) {
    const hotLeads = recentLeads.filter(l => l.aiScore === 'hot' || l.status === 'new');
    if (hotLeads.length > 0) {
      reply = `🔥 **Priority Leads**\n\n${hotLeads.map(l => `• **${l.name}** — ${l.status}, Budget: ${l.budget ? formatCurrency(l.budget, true) : 'N/A'}`).join('\n')}\n\nThese leads should be contacted first. Focus on the ones with higher budgets.`;
    } else {
      reply = 'No hot leads found at the moment. All recent leads appear to be in follow-up stages.';
    }
  } else if (lower.includes('follow') || lower.includes('suggest')) {
    reply = `📋 **Follow-up Recommendations**\n\n1. Reach out to leads in "contacted" status who haven't had activity in 2+ days\n2. Schedule site visits for "qualified" leads\n3. Send property brochures to leads matching their budget range\n4. Follow up on ${activeDeals} active deal${activeDeals !== 1 ? 's' : ''} in the pipeline\n\nConsistent follow-up is the #1 factor in real estate conversions.`;
  } else if (lower.includes('property') || lower.includes('match') || lower.includes('recommend')) {
    reply = `🏠 **Property Insights**\n\nYou have ${properties} properties in inventory. To improve matching:\n\n1. Tag properties with price ranges for faster lead-property matching\n2. Add high-quality photos to increase engagement\n3. Focus on properties matching the most common lead budgets\n\nWant me to analyze specific lead-property matches?`;
  } else {
    reply = `I'm here to help with your CRM! Here's what I can assist with:\n\n• **Pipeline summary** — Get an overview of your leads\n• **Hot leads** — See which leads to prioritize\n• **Follow-up suggestions** — Get actionable recommendations\n• **Property matching** — Find the best property-lead fits\n\nYour current stats: ${totalLeads} leads, ${activeDeals} active deals, ${conversionRate}% conversion rate.`;
  }

  return NextResponse.json({ reply });
}
