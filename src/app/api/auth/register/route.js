import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// Basic in-memory rate limiter to prevent bot spam
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const record = rateLimitCache.get(ip);
  if (!record) {
    rateLimitCache.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  if (now - record.firstRequest > RATE_LIMIT_WINDOW_MS) {
    rateLimitCache.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limited
  }
  record.count += 1;
  return true;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { orgName, userName, email, password, phone, accountType } = body;

    const resolvedAccountType = accountType === 'broker' ? 'broker' : 'agency';

    if (!userName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate Limiting Protection
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    // Password Security Policy
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // For agency accounts, org name is required
    if (resolvedAccountType === 'agency' && !orgName) {
      return NextResponse.json({ error: 'Organization name is required for agency accounts' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // For broker accounts, auto-generate org name from user name
    const finalOrgName = resolvedAccountType === 'broker'
      ? `${userName}'s Workspace`
      : orgName;

    // Generate unique slug for organization
    const baseSlug = finalOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use a transaction to ensure both Org and User are created
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: finalOrgName,
          slug,
          accountType: resolvedAccountType,
        },
      });

      const user = await tx.user.create({
        data: {
          name: userName,
          email,
          phone,
          hashedPassword,
          role: resolvedAccountType === 'broker' ? 'broker_owner' : 'super_admin',
          orgId: org.id,
        },
      });

      return { org, user };
    });

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        orgId: result.org.id,
        orgName: result.org.name,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Register API Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
