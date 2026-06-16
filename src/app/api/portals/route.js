/**
 * GET  /api/portals     — List all portal sources for the org
 * POST /api/portals     — Create a new portal source + generate API key
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateApiKey, hashApiKey } from '@/lib/portalAuth';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sources = await prisma.portalSource.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { leads: true } },
    },
  });

  // Attach recent lead counts from PortalLog
  const enriched = await Promise.all(
    sources.map(async (s) => {
      const [totalLogs, successLogs, duplicateLogs, errorLogs, todayLogs] = await Promise.all([
        prisma.portalLog.count({ where: { orgId: session.user.orgId, sourceSlug: s.slug } }),
        prisma.portalLog.count({ where: { orgId: session.user.orgId, sourceSlug: s.slug, status: 'success' } }),
        prisma.portalLog.count({ where: { orgId: session.user.orgId, sourceSlug: s.slug, status: 'duplicate' } }),
        prisma.portalLog.count({ where: { orgId: session.user.orgId, sourceSlug: s.slug, status: { in: ['error', 'invalid'] } } }),
        prisma.portalLog.count({
          where: {
            orgId: session.user.orgId,
            sourceSlug: s.slug,
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ]);

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        isActive: s.isActive,
        apiKeyHint: s.apiKeyHint,
        totalLeads: s.totalLeads,
        lastLeadAt: s.lastLeadAt,
        createdAt: s.createdAt,
        stats: { totalLogs, successLogs, duplicateLogs, errorLogs, todayLogs },
      };
    })
  );

  return NextResponse.json({ sources: enriched });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, slug, description } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
  }

  // Validate slug format
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').trim();
  if (!cleanSlug || cleanSlug.length < 2) {
    return NextResponse.json({ error: 'slug must be at least 2 lowercase alphanumeric characters' }, { status: 400 });
  }

  // Check for duplicate slug within org
  const existing = await prisma.portalSource.findFirst({
    where: { orgId: session.user.orgId, slug: cleanSlug },
  });
  if (existing) {
    return NextResponse.json({ error: `A portal with slug "${cleanSlug}" already exists` }, { status: 409 });
  }

  // Generate API key — shown ONCE, then only hint stored
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);
  const apiKeyHint = `...${apiKey.slice(-4)}`;

  const source = await prisma.portalSource.create({
    data: {
      name: name.trim(),
      slug: cleanSlug,
      description: description?.trim() || null,
      apiKeyHash,
      apiKeyHint,
      orgId: session.user.orgId,
    },
  });

  // Return the plain-text key ONCE in the response — never stored
  return NextResponse.json(
    {
      source: {
        id: source.id,
        name: source.name,
        slug: source.slug,
        isActive: source.isActive,
        createdAt: source.createdAt,
      },
      apiKey,  // ⚠️ Show once — not stored in DB
      webhookUrl: `/api/leads/import`,
      instructions: {
        method: 'POST',
        endpoint: '/api/leads/import',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        samplePayload: {
          name: 'Rajesh Kumar',
          phone: '9876543210',
          email: 'rajesh@example.com',
          budget: '50L',
          source: cleanSlug,
          property_type: 'apartment',
          city: 'Mumbai',
          locality: 'Andheri West',
          message: 'Looking for 3BHK ready to move',
        },
      },
    },
    { status: 201 }
  );
}
