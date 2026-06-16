/**
 * Lead Validation & Normalization Layer
 * Strictly validates and cleans incoming portal payloads.
 */

/**
 * Normalize a phone number to E.164 format (Indian numbers: +91XXXXXXXXXX)
 */
function normalizePhone(raw) {
  if (!raw) return null;
  // Strip everything except digits
  const digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.length === 0) return null;

  // Already has country code 91
  if (digits.startsWith('91') && digits.length === 12) return digits;
  // 10-digit Indian mobile
  if (digits.length === 10) return `91${digits}`;
  // 11-digit with leading 0
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  // Accept as-is if between 8-15 digits (international)
  if (digits.length >= 8 && digits.length <= 15) return digits;

  return null;
}

/**
 * Title-case a name string
 */
function titleCase(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ');
}

/**
 * Strip HTML tags and trim a string
 */
function sanitizeText(str, maxLen = 500) {
  if (!str) return null;
  return String(str)
    .replace(/<[^>]*>/g, '')   // strip HTML
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // strip control chars
    .trim()
    .slice(0, maxLen) || null;
}

/**
 * Normalize source slug to known values
 */
function normalizeSource(raw) {
  if (!raw) return 'api';
  const s = String(raw).toLowerCase().trim();
  const MAP = {
    magicbricks: 'magicbricks',
    'magic bricks': 'magicbricks',
    mb: 'magicbricks',
    '99acres': '99acres',
    '99 acres': '99acres',
    acres99: '99acres',
    facebook: 'facebook',
    fb: 'facebook',
    'facebook ads': 'facebook',
    meta: 'facebook',
    housing: 'housing',
    'housing.com': 'housing',
    website: 'website',
    web: 'website',
    referral: 'referral',
    ref: 'referral',
    walkin: 'walkin',
    'walk-in': 'walkin',
    'walk in': 'walkin',
    whatsapp: 'whatsapp',
    wa: 'whatsapp',
    instagram: 'instagram',
    insta: 'instagram',
    google: 'google',
    'google ads': 'google',
  };
  return MAP[s] || s;
}

/**
 * Parse budget to a float, accepting strings like "50L", "1.2Cr", "50,00,000"
 */
function parseBudget(raw) {
  if (!raw && raw !== 0) return null;
  const s = String(raw).toLowerCase().replace(/,/g, '').trim();
  if (!s) return null;

  let num = null;

  // Handle shorthand: 50L = 5000000, 1.2Cr = 12000000
  const crMatch = s.match(/^([\d.]+)\s*cr/i);
  if (crMatch) {
    num = parseFloat(crMatch[1]) * 10000000;
  } else {
    const lMatch = s.match(/^([\d.]+)\s*l/i);
    if (lMatch) {
      num = parseFloat(lMatch[1]) * 100000;
    } else {
      const kMatch = s.match(/^([\d.]+)\s*k/i);
      if (kMatch) {
        num = parseFloat(kMatch[1]) * 1000;
      } else {
        num = parseFloat(s);
      }
    }
  }

  if (isNaN(num) || num <= 0) return null;
  // Sanity clamp: 1 lakh to 1000 crore
  if (num < 100000 || num > 10000000000) return null;
  return Math.round(num);
}

/**
 * Main validation entry point.
 * @param {object} payload - Raw incoming JSON from portal
 * @returns {{ data: object|null, errors: string[] }}
 */
export function validateAndNormalize(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { data: null, errors: ['Request body must be a JSON object'] };
  }

  // ── Phone (required) ─────────────────────────────────────────
  const phone = normalizePhone(payload.phone || payload.mobile || payload.contact);
  if (!phone) {
    errors.push('phone is required and must be a valid number (8-15 digits)');
  }

  // ── Name (required, soft) ─────────────────────────────────────
  const rawName = payload.name || payload.full_name || payload.fullName || payload.contact_name || '';
  const name = titleCase(sanitizeText(rawName));
  if (!name || name.length < 2) {
    // If no name given, use a placeholder — don't hard-reject
    // Real portals sometimes omit names
  }

  if (errors.length > 0) {
    return { data: null, errors };
  }

  // ── Optional fields ───────────────────────────────────────────
  const email = sanitizeText(payload.email || payload.email_address || '');
  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValid) errors.push('email format is invalid');

  const source = normalizeSource(
    payload.source || payload.portal || payload.utm_source || payload.lead_source || 'api'
  );

  const budget = parseBudget(
    payload.budget || payload.budget_min || payload.price_range
  );

  const budgetMax = parseBudget(
    payload.budget_max || payload.budget_to || payload.price_range_max
  );

  const propertyType = sanitizeText(
    payload.property_type || payload.propertyType || payload.property_interest || ''
  )?.toLowerCase();

  const city = sanitizeText(payload.city || payload.location_city || '');
  const locality = sanitizeText(
    payload.locality || payload.area || payload.location || payload.preferred_location || ''
  );
  const notes = sanitizeText(
    payload.notes || payload.message || payload.remarks || payload.requirement || '',
    1000
  );

  // Merge email error (soft — still process the lead)
  if (!emailValid) {
    // don't block, just skip invalid email
  }

  const data = {
    name: name || 'Unknown',
    phone,
    email: emailValid ? (email || null) : null,
    source,
    budget,
    budgetMax: budgetMax && budgetMax > (budget || 0) ? budgetMax : null,
    propertyType: propertyType || null,
    city: city || null,
    locality: locality || null,
    notes: notes || null,
    status: 'new',
  };

  return { data, errors: [] };
}
