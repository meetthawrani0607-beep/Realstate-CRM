import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// ─── Currency ────────────────────────────────────────────────────
export function formatCurrency(amount, compact = false) {
  if (amount == null) return '—';
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Date helpers ────────────────────────────────────────────────
export function formatDate(date) {
  const d = new Date(date);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, yyyy');
}

export function timeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateTime(date) {
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
}

// ─── Status helpers ──────────────────────────────────────────────
export const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: '#6C7AE0' },
  { value: 'contacted', label: 'Contacted', color: '#E0A84C' },
  { value: 'qualified', label: 'Qualified', color: '#4CADE0' },
  { value: 'visit_scheduled', label: 'Visit Scheduled', color: '#A855F7' },
  { value: 'negotiation', label: 'Negotiation', color: '#F97316' },
  { value: 'closed_won', label: 'Closed Won', color: '#22C55E' },
  { value: 'closed_lost', label: 'Closed Lost', color: '#EF4444' },
];

export const PIPELINE_COLUMNS = [
  'new', 'contacted', 'qualified', 'visit_scheduled', 'negotiation', 'closed_won',
];

export const AI_SCORES = [
  { value: 'hot', label: 'Hot', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  { value: 'warm', label: 'Warm', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  { value: 'cold', label: 'Cold', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
];

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
];

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: '99acres', label: '99acres' },
  { value: 'magicbricks', label: 'MagicBricks' },
  { value: 'referral', label: 'Referral' },
  { value: 'walkin', label: 'Walk-in' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'api', label: 'API' },
];

export function getStatusMeta(status) {
  return LEAD_STATUSES.find((s) => s.value === status) || LEAD_STATUSES[0];
}

export function getAIScoreMeta(score) {
  return AI_SCORES.find((s) => s.value === score);
}

// ─── Misc ────────────────────────────────────────────────────────
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function parseJsonField(value, fallback = []) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}
