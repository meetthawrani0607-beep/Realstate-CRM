'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate, timeAgo, getStatusMeta, getAIScoreMeta, getInitials, LEAD_STATUSES } from '@/lib/utils';
import { 
  ChevronLeft, User, Phone, Mail, FileText, Calendar, Sparkles, 
  Trash2, ClipboardList, Clock, ExternalLink, Info, CheckCircle2, MessageSquare
} from 'lucide-react';

const TIMELINE_ICONS = {
  call: <Phone size={14} />,
  note: <FileText size={14} />,
  whatsapp: <MessageSquare size={14} />,
  visit: <Calendar size={14} />,
  default: <Sparkles size={14} />
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [qualifying, setQualifying] = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${id}`).then(r => r.json()).then(data => {
      setLead(data.lead);
      setActivities(data.activities || []);
      setLoading(false);
    });
  }, [id]);

  async function addNote() {
    if (!noteText.trim()) return;
    await fetch(`/api/leads/${id}/activity`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'note', title: 'Note added', content: noteText }),
    });
    setNoteText('');
    const data = await fetch(`/api/leads/${id}`).then(r => r.json());
    setActivities(data.activities || []);
  }

  async function updateStatus(status) {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setLead(prev => ({ ...prev, status }));
  }

  async function runAI() {
    setQualifying(true);
    const res = await fetch('/api/ai/qualify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: id }),
    });
    const data = await res.json();
    if (data.score) setLead(prev => ({ ...prev, aiScore: data.score, aiNotes: data.reason }));
    setQualifying(false);
  }

  async function deleteLead() {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    router.push('/dashboard/leads');
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 8 }}></div>
            <div className="skeleton" style={{ width: 150, height: 28, borderRadius: 4 }}></div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton" style={{ width: 100, height: 34, borderRadius: 6 }}></div>
            <div className="skeleton" style={{ width: 100, height: 34, borderRadius: 6 }}></div>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 20 }}></div>
            <div className="skeleton" style={{ width: '100%', height: 100, borderRadius: 12, marginBottom: 20 }}></div>
            <div className="skeleton" style={{ width: '100%', height: 300, borderRadius: 12 }}></div>
          </div>
          <div className="detail-sidebar flex flex-col gap-4">
            <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 12 }}></div>
            <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 12 }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="page-body py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
        <Info size={36} className="stroke-[1.5]" />
        <p>Lead details not found in database registry.</p>
        <Link href="/dashboard/leads" className="text-primary hover:underline text-sm font-semibold">Back to lead table</Link>
      </div>
    );
  }

  const st = getStatusMeta(lead.status);
  const ai = getAIScoreMeta(lead.aiScore);

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/dashboard/leads" className="btn-icon text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg p-2 transition-colors">
            <ChevronLeft size={16} />
          </Link>
          <div className="user-avatar text-white font-bold" style={{ width: 38, height: 38, fontSize: '0.82rem', background: 'linear-gradient(135deg, var(--accent), var(--accent-light))' }}>
            {getInitials(lead.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white m-0" style={{ lineHeight: 1.2 }}>{lead.name}</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lead.phone}</span>
          </div>
          {ai && (
            <span className={`badge badge-${ai.value} font-semibold`} style={{ marginLeft: 4 }}>
              {ai.label}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => {
            const cleaned = lead.phone.replace(/[^0-9]/g, '');
            const full = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
            window.open(`https://wa.me/${full}`, '_blank');
          }}>
            <MessageSquare size={12} />
            Quick WhatsApp
          </button>
          <button className="btn btn-secondary btn-sm flex items-center gap-1.5 text-slate-350 hover:text-white" onClick={runAI} disabled={qualifying}>
            <Sparkles size={12} className={qualifying ? 'animate-pulse text-indigo-400' : 'text-indigo-400'} />
            {qualifying ? 'Scoring...' : 'Assess Lead (AI)'}
          </button>
          <button className="btn btn-danger btn-sm flex items-center gap-1.5" onClick={deleteLead}>
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="detail-grid animate-fade-in">
          {/* Main Content */}
          <div>
            {/* Info Card */}
            <div className="card" style={{ marginBottom: 22 }}>
              <div className="section-header border-b border-slate-800/60 pb-3 mb-4" style={{ marginBottom: 16 }}>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <User size={16} className="text-indigo-400" />
                  Lead Demographics
                </h3>
                <span className="badge" style={{ background: st.color + '18', color: st.color, border: `1px solid ${st.color}20` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, display: 'inline-block', marginRight: 6 }} />
                  {st.label}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                <div className="detail-field">
                  <label className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1">Phone</label>
                  <p className="text-slate-200 text-sm font-medium">{lead.phone}</p>
                </div>
                <div className="detail-field">
                  <label className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1">Email</label>
                  <p className="text-slate-200 text-sm font-medium">{lead.email || '—'}</p>
                </div>
                <div className="detail-field">
                  <label className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1">Acquisition Source</label>
                  <p className="text-slate-200 text-sm font-medium capitalize">{lead.source || '—'}</p>
                </div>
                <div className="detail-field">
                  <label className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1">Buyer Budget Limit</label>
                  <p className="text-slate-200 text-sm font-medium">{lead.budget ? formatCurrency(lead.budget, true) : '—'}{lead.budgetMax ? ` – ${formatCurrency(lead.budgetMax, true)}` : ''}</p>
                </div>
                <div className="detail-field">
                  <label className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1">Desired Property Type</label>
                  <p className="text-slate-200 text-sm font-medium capitalize">{lead.propertyType || '—'}</p>
                </div>
                <div className="detail-field">
                  <label className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1">Target Geo Location</label>
                  <p className="text-slate-200 text-sm font-medium">{[lead.locality, lead.city].filter(Boolean).join(', ') || '—'}</p>
                </div>
              </div>
              {lead.notes && (
                <div className="detail-field" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <label className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1.5">Acquisition Notes</label>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Add Note */}
            <div className="card" style={{ marginBottom: 22 }}>
              <h3 className="text-sm font-semibold text-white mb-3">Add Customer Touchpoint / Note</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  placeholder="Record customer status update, call notes, or follow up highlights..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNote()}
                  style={{ flex: 1 }}
                  className="bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                />
                <button className="btn btn-primary flex items-center gap-1" onClick={addNote}>
                  <ClipboardList size={14} />
                  Add Activity
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="section-header border-b border-slate-800/60 pb-3 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                <h3 className="text-base font-semibold text-white m-0">Interaction Timeline</h3>
              </div>
              {activities.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="py-2">No activity events recorded for this lead yet.</p>
              ) : (
                <div className="timeline">
                  {activities.map(a => (
                    <div key={a.id} className="timeline-item">
                      <div className={`timeline-icon ${a.type} flex items-center justify-center`}>
                        {TIMELINE_ICONS[a.type] || TIMELINE_ICONS.default}
                      </div>
                      <div className="timeline-content bg-slate-900/10 border border-slate-800/40 p-3 rounded-lg">
                        <h5 className="font-semibold text-sm text-slate-200 m-0">{a.title}</h5>
                        {a.content && <p className="text-slate-450 text-xs mt-1.5 mb-2 leading-relaxed">{a.content}</p>}
                        <time className="text-[10px] text-slate-500">{timeAgo(a.createdAt)}</time>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-sidebar flex flex-col gap-4">
            <div className="card">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Status State Machine</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {LEAD_STATUSES.filter(s => s.value !== 'closed_lost').map(s => (
                  <button key={s.value} className={`btn btn-sm flex items-center gap-2 ${lead.status === s.value ? '' : 'btn-ghost text-slate-400 hover:text-white'}`}
                    style={lead.status === s.value ? {
                      background: s.color + '18', color: s.color,
                      boxShadow: `0 0 10px ${s.color}15`,
                      border: `1px solid ${s.color}30`,
                      justifyContent: 'flex-start'
                    } : { justifyContent: 'flex-start' }}
                    onClick={() => updateStatus(s.value)}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {ai && (
              <div className="card" style={{
                borderColor: ai.value === 'hot' ? 'rgba(239,68,68,0.25)' : 'var(--border)',
                boxShadow: ai.value === 'hot' ? '0 0 20px rgba(239,68,68,0.08)' : 'none'
              }}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-indigo-400" />
                  AI Qualify Report
                </h3>
                <span className={`badge badge-${ai.value}`} style={{ marginBottom: 10, display: 'inline-flex' }}>{ai.label}</span>
                {lead.aiNotes && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{lead.aiNotes}</p>}
              </div>
            )}

            <div className="card">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Navigation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button className="btn btn-ghost btn-sm text-slate-400 hover:text-white flex items-center gap-2 justify-start" onClick={() => {
                  const cleaned = lead.phone.replace(/[^0-9]/g, '');
                  const full = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
                  window.open(`https://wa.me/${full}?text=${encodeURIComponent(`Hi ${lead.name}, `)}`, '_blank');
                }}>
                  <MessageSquare size={12} />
                  WhatsApp Web Chat
                </button>
                <Link href={`/dashboard/whatsapp?lead=${id}`} className="btn btn-ghost btn-sm text-slate-400 hover:text-white flex items-center gap-2 justify-start">
                  <MessageSquare size={12} />
                  Outbound Templates
                </Link>
                <Link href={`/dashboard/calendar?lead=${id}`} className="btn btn-ghost btn-sm text-slate-400 hover:text-white flex items-center gap-2 justify-start">
                  <Calendar size={12} />
                  Schedule Site Visit
                </Link>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Ingestion</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{formatDate(lead.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
