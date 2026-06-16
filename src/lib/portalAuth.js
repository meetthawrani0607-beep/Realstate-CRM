/**
 * Portal Auth Middleware
 * Authenticates external portal webhooks via X-API-Key header.
 * No session required — public endpoint secured by API key.
 */

import { createHash } from 'crypto';
import prisma from './prisma';

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a secure random API key
 */
export function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return 'pk_' + Array.from(randomBytes).map(b => chars[b % chars.length]).join('');
}

/**
 * Authenticate an incoming portal request.
 * Returns { source, orgId } or throws with status code.
 *
 * @param {Request} req - Next.js request object
 * @param {string} slugFromUrl - The portal slug from the URL params (optional)
 */
export async function authenticatePortal(req, slugFromUrl = null) {
  // Extract API key from header or query string
  const apiKey =
    req.headers.get('x-api-key') ||
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    new URL(req.url).searchParams.get('api_key');

  if (!apiKey) {
    throw { status: 401, message: 'Missing API key. Provide X-API-Key header or api_key query param.' };
  }

  if (!apiKey.startsWith('pk_') || apiKey.length < 10) {
    throw { status: 401, message: 'Invalid API key format.' };
  }

  const keyHash = hashApiKey(apiKey);

  // Find matching active portal source
  const where = { apiKeyHash: keyHash, isActive: true };
  if (slugFromUrl) where.slug = slugFromUrl;

  const source = await prisma.portalSource.findFirst({
    where,
    include: { org: true },
  });

  if (!source) {
    throw { status: 401, message: 'Invalid or inactive API key.' };
  }

  return { source, org: source.org, orgId: source.orgId };
}

/**
 * Get caller IP from request headers (works behind proxies)
 */
export function getCallerIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
