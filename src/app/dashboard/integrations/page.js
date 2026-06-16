'use client';
import { useState, useEffect, useRef } from 'react';
import { timeAgo } from '@/lib/utils';
import { 
  Plug, Key, Activity, Copy, Check, Plus, X, Globe, 
  RefreshCw, Play, Pause, AlertTriangle, ShieldCheck, Database, Zap, BookOpen
} from 'lucide-react';

const SOURCE_ICONS = {
  magicbricks: '🏠',
  '99acres': '🔑',
  facebook: '📘',
  website: '🌐',
  google: '🔍',
  housing: '🏡',
  instagram: '📸',
  referral: '🤝',
  walkin: '🚶',
  default: '🔌',
};

const STATUS_STYLES = {
  success: { color: 'var(--green)', bg: 'var(--green-bg)', label: 'Created' },
  duplicate: { color: 'var(--blue)', bg: 'var(--blue-bg)', label: 'Duplicate' },
  invalid: { color: 'var(--orange)', bg: 'var(--orange-bg)', label: 'Invalid' },
  error: { color: 'var(--red)', bg: 'var(--red-bg)', label: 'Error' },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="btn btn-ghost btn-sm flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900" style={{ padding: '4px 10px' }}>
      {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function StatCard({ label, value, sub, icon, iconClass }) {
  return (
    <div className="card stat-card bg-white border border-slate-200 shadow-sm">
      <div className="stat-card-body">
        <div className="stat-card-info">
          <div className="stat-label text-slate-600">{label}</div>
          <div className="stat-value text-slate-900">{value ?? '—'}</div>
          {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
        </div>
        <div className={`stat-card-icon ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('portals'); // portals | logs | test

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [s, src] = await Promise.all([
      fetch('/api/portals/stats').then(r => r.json()),
      fetch('/api/portals').then(r => r.json()),
    ]);
    setStats(s);
    setSources(src.sources || []);
  }

  async function handleCreate(form) {
    const res = await fetch('/api/portals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setNewKey(data);
      fetchAll();
    } else {
      alert(data.error || 'Failed to create portal');
    }
  }

  async function toggleActive(id, current) {
    await fetch(`/api/portals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchAll();
  }

  async function handleTestWebhook(sourceId, apiKeyHint) {
    const apiKey = prompt(`Enter full API key for this portal (ends in ${apiKeyHint}):`);
    if (!apiKey) return;
    setTestLoading(sourceId);
    setTestResult(null);

    const payload = {
      name: 'Test Lead',
      phone: `99${Math.floor(Math.random() * 90000000 + 10000000)}`,
      email: 'test@propcrm.io',
      budget: '5000000',
      source: sources.find(s => s.id === sourceId)?.slug || 'test',
      property_type: 'apartment',
      city: 'Mumbai',
      locality: 'Test Locality',
      message: 'This is a test lead from PropCRM integration tester',
    };

    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestResult({ ok: res.ok, status: res.status, data, payload });
    } catch (err) {
      setTestResult({ ok: false, data: { message: err.message }, payload });
    }
    setTestLoading(null);
    setTimeout(fetchAll, 800);
  }

  const overview = stats?.overview;
  const recentLogs = stats?.recentLogs || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Plug size={24} className="text-primary" />
            Portal Integrations
          </h2>
          <p className="text-sm text-slate-500 mt-1">Connect MagicBricks, 99acres, social campaigns, or custom site forms to receive leads instantly.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setNewKey(null); setShowAddModal(true); }}>
          <Plus size={16} />
          Add Integration
        </button>
      </div>

      <div className="page-body">

        {/* Stats Row */}
        <div className="stats-grid animate-fade-in" style={{ marginBottom: 24 }}>
          <StatCard label="Active Portals" value={overview?.activeSources} icon={<Plug size={20} />} iconClass="blue" sub={`${overview?.totalSources} total configured`} />
          <StatCard label="Leads Today" value={overview?.todayLeads} icon={<Database size={20} />} iconClass="violet" sub={`${overview?.weekLeads} this week`} />
          <StatCard label="Success Rate" value={overview?.successRate != null ? `${overview.successRate}%` : '—'} icon={<ShieldCheck size={20} />} iconClass="green" sub={`${overview?.totalRequests} total requests`} />
          <StatCard label="Duplicate Rate" value={overview?.duplicateRate != null ? `${overview.duplicateRate}%` : '—'} icon={<Zap size={20} />} iconClass="orange" sub="Intelligently auto-deduplicated" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 bg-white border border-slate-200 rounded-lg mb-6 w-fit shadow-sm">
          {[
            ['portals', <span className="flex items-center gap-1.5"><Plug size={14} /> Portals</span>],
            ['logs', <span className="flex items-center gap-1.5"><Activity size={14} /> Request Log</span>],
            ['test', <span className="flex items-center gap-1.5"><Zap size={14} /> Live Webhook Tester</span>]
          ].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`text-xs font-semibold px-4 py-2 rounded-md transition-all ${
                activeTab === key 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── PORTALS TAB ── */}
        {activeTab === 'portals' && (
          <div className="animate-fade-in">
            {sources.length === 0 ? (
              <div className="empty-state bg-slate-50 border border-slate-200 p-12 rounded-xl text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <Plug size={22} />
                </div>
                <h3 className="text-slate-900 text-lg font-bold mb-2">No integrations created yet</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Create an API portal to start accepting automated payloads from listing portals, CRM forms, and campaign endpoints.</p>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>Configure Portal Key</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
                {sources.map(source => (
                  <div key={source.id} className="card animate-slide-up bg-white border border-slate-200 shadow-sm" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }} className="bg-slate-50">
                      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }} className="border border-indigo-100">
                        {SOURCE_ICONS[source.slug] || SOURCE_ICONS.default}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }} className="text-slate-900 truncate">{source.name}</h4>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700,
                            background: source.isActive ? 'var(--green-bg)' : 'var(--bg-input)',
                            color: source.isActive ? 'var(--green)' : 'var(--text-muted)',
                            border: `1px solid ${source.isActive ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`
                          }}>
                            {source.isActive ? '● LIVE' : '○ OFF'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                          slug: <span className="text-primary font-medium">{source.slug}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, borderBottom: '1px solid var(--border)' }} className="bg-white">
                      {[
                        { label: 'Total Leads', value: source.totalLeads, color: 'var(--text-primary)' },
                        { label: 'Success', value: source.stats?.successLogs, color: 'var(--green)' },
                        { label: 'Dupes', value: source.stats?.duplicateLogs, color: 'var(--blue)' },
                      ].map(m => (
                        <div key={m.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: m.color }}>{m.value ?? 0}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* API Key + Last activity */}
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Auth Key</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {source.lastLeadAt ? `Last active ${timeAgo(source.lastLeadAt)}` : 'No payload yet'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ flex: 1, background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                          pk_••••••••••••{source.apiKeyHint}
                        </code>
                      </div>
                    </div>

                    {/* Webhook URL */}
                    <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>JSON Webhook endpoint</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <code style={{ fontSize: '0.75rem', color: 'var(--primary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
                          POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/leads/import
                        </code>
                        <CopyButton text={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/leads/import`} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ padding: '12px 20px', display: 'flex', gap: 6, background: 'var(--bg-card)' }}>
                      <button
                        className={`btn btn-sm flex items-center justify-center gap-1.5 ${source.isActive ? 'btn-secondary text-slate-700' : 'btn-primary'}`}
                        onClick={() => toggleActive(source.id, source.isActive)}
                        style={{ flex: 1 }}>
                        {source.isActive ? <Pause size={12} /> : <Play size={12} />}
                        {source.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm flex items-center justify-center gap-1.5 text-slate-700"
                        style={{ flex: 1 }}
                        disabled={testLoading === source.id}
                        onClick={() => handleTestWebhook(source.id, source.apiKeyHint)}>
                        {testLoading === source.id ? 'Testing...' : 'Test Webhook'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {activeTab === 'logs' && (
          <div className="table-wrap animate-fade-in card p-0 border border-slate-200 shadow-sm overflow-hidden">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="bg-slate-50">
              <span className="font-bold text-slate-900 text-sm">Recent Integration Activity Logs</span>
              <button className="btn btn-ghost btn-sm flex items-center gap-1 text-slate-600 hover:text-slate-900" onClick={fetchAll}>
                <RefreshCw size={12} />
                Refresh Logs
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse text-left bg-white">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Lead</th>
                    <th className="py-3 px-4">Caller IP</th>
                    <th className="py-3 px-4">Error details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {recentLogs.map(log => {
                    const st = STATUS_STYLES[log.status] || STATUS_STYLES.error;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{timeAgo(log.createdAt)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{SOURCE_ICONS[log.sourceSlug] || SOURCE_ICONS.default}</span>
                            <span className="text-xs">{log.sourceSlug}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: 'rgba(0,0,0,0.05)' }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-600 text-xs">{log.action || '—'}</td>
                        <td className="py-3 px-4">
                          {log.lead ? (
                            <a href={`/dashboard/leads/${log.leadId}`} className="text-primary hover:underline font-semibold">
                              {log.lead.name}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{log.ip}</td>
                        <td className="py-3 px-4 text-rose-600 font-mono text-xs max-w-[200px] truncate" title={log.errorMessage}>
                          {log.errorMessage || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {recentLogs.length === 0 && (
              <div className="empty-state py-8 text-center text-slate-500 text-sm bg-white">No payload attempts logged inside the pipeline.</div>
            )}
          </div>
        )}

        {/* ── TEST TOOL TAB ── */}
        {activeTab === 'test' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            <TestPayloadTool sources={sources} onResult={setTestResult} onRefresh={fetchAll} />
            {testResult && (
              <div className="card flex flex-col gap-4 animate-scale-in bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 750, margin: 0 }} className="flex items-center gap-2">
                    {testResult.ok ? (
                      <span className="text-emerald-600">● Webhook Processed Successfully</span>
                    ) : (
                      <span className="text-rose-600">● Webhook Import Rejected</span>
                    )}
                  </h3>
                  <span className={`badge ${testResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} px-2.5 py-1 rounded-full text-xs font-bold`}>
                    HTTP {testResult.status}
                  </span>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Response JSON payload
                  </div>
                  <pre style={{
                    background: 'var(--bg-elevated)', padding: 14, borderRadius: 'var(--radius)',
                    fontSize: '0.78rem', color: testResult.ok ? 'var(--green)' : 'var(--red)',
                    overflow: 'auto', maxHeight: 220, border: '1px solid var(--border)', fontFamily: 'monospace'
                  }}>
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Sent Mock Payload</div>
                  <pre style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 'var(--radius)', fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 180, border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                    {JSON.stringify(testResult.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test result from portal card button */}
        {testResult && activeTab === 'portals' && (
          <div className="card animate-slide-up bg-white border border-slate-200 shadow-sm" style={{ marginTop: 20 }}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }} className={testResult.ok ? 'text-emerald-600' : 'text-rose-600'}>
                {testResult.ok ? '✅ Integration Webhook Test Passed' : '❌ Integration Webhook Test Failed'}
              </h3>
              <span className={`badge ${testResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} px-2.5 py-1 rounded-full text-xs font-bold`}>
                HTTP {testResult.status}
              </span>
            </div>
            <pre style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 'var(--radius)', fontSize: '0.78rem', color: testResult.ok ? 'var(--green)' : 'var(--red)', overflow: 'auto', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
            <button className="btn btn-ghost btn-sm text-slate-500 hover:text-slate-900 mt-3" onClick={() => setTestResult(null)}>Close Output Window</button>
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setNewKey(null); }}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: newKey ? 580 : 480 }}>
            {newKey ? (
              <ApiKeyReveal data={newKey} onClose={() => { setShowAddModal(false); setNewKey(null); }} />
            ) : (
              <AddPortalForm onCreate={handleCreate} onClose={() => { setShowAddModal(false); setNewKey(null); }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Add Portal Form ──────────────────────────────────────────────────────── */
function AddPortalForm({ onCreate, onClose }) {
  const PRESETS = [
    { name: 'MagicBricks', slug: 'magicbricks', icon: '🏠' },
    { name: '99acres', slug: '99acres', icon: '🔑' },
    { name: 'Facebook Ads', slug: 'facebook', icon: '📘' },
    { name: 'Website Form', slug: 'website', icon: '🌐' },
    { name: 'Google Ads', slug: 'google', icon: '🔍' },
    { name: 'Instagram', slug: 'instagram', icon: '📸' },
    { name: 'Housing.com', slug: 'housing', icon: '🏡' },
    { name: 'Custom Portal', slug: '', icon: '🔌' },
  ];
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  function selectPreset(p) {
    setForm(f => ({ ...f, name: p.name, slug: p.slug }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  }

  return (
    <>
      <div className="modal-header border-b border-slate-200 pb-3 mb-4">
        <h3 className="text-slate-900 text-base font-bold flex items-center gap-2 m-0">
          <Plug size={18} className="text-primary" />
          Create Portal Integration Key
        </h3>
        <button className="btn-icon text-slate-500 hover:text-slate-900" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="modal-body p-0">
        <p className="text-xs text-slate-500 mb-4">
          Establish an incoming pipeline and generate a secure access token for automated syncs.
        </p>
        
        {/* Preset picker */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {PRESETS.map(p => (
            <button key={p.slug || 'custom'} onClick={() => selectPreset(p)}
              style={{
                padding: '10px 8px', borderRadius: 'var(--radius)', 
                border: `1.5px solid ${form.slug === p.slug && form.name === p.name ? 'var(--primary)' : 'var(--border)'}`,
                background: form.slug === p.slug && form.name === p.name ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-elevated)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
              }}>
              <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{p.icon}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="text-slate-700 font-semibold text-xs mb-1.5 block">Integration Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. MagicBricks Premium Channel" className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
          </div>
          <div className="form-group">
            <label className="text-slate-700 font-semibold text-xs mb-1.5 block">Slug URL parameter *</label>
            <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="e.g. magicbricks-delhi" className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Alphanumeric characters and hyphens only.</div>
          </div>
          <div className="form-group">
            <label className="text-slate-700 font-semibold text-xs mb-1.5 block">Description / Context</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Inbound leads from south delhi campaigns" className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
          </div>
          <div className="modal-footer" style={{ padding: 0, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex items-center gap-1.5" disabled={saving}>
              <Key size={14} />
              {saving ? 'Generating key...' : 'Generate API Key'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ── API Key Reveal (shown once) ─────────────────────────────────────────── */
function ApiKeyReveal({ data, onClose }) {
  const [confirmed, setConfirmed] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <div className="modal-header border-b border-slate-200 pb-3 mb-4">
        <h3 className="text-slate-900 text-base font-bold flex items-center gap-2 m-0">
          <ShieldCheck size={18} className="text-emerald-600" />
          Integration Credentials Generated
        </h3>
      </div>
      <div className="modal-body p-0 flex flex-col gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-600" />
          <div>
            <strong>Save your production API Token now.</strong> It will not be readable from security records after navigating away from this prompt window.
          </div>
        </div>

        <div className="form-group">
          <label className="text-slate-700 font-semibold text-xs mb-1 block">Authentication Key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <code style={{ flex: 1, background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 'var(--radius)', fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--text-primary)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
              {data.apiKey}
            </code>
            <CopyButton text={data.apiKey} />
          </div>
        </div>

        <div className="form-group">
          <label className="text-slate-700 font-semibold text-xs mb-1 block">Webhook Destination URL</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <code style={{ flex: 1, background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--primary)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
              POST {origin}/api/leads/import
            </code>
            <CopyButton text={`${origin}/api/leads/import`} />
          </div>
        </div>

        <div className="form-group">
          <label className="text-slate-700 font-semibold text-xs mb-1 block">Required Header</label>
          <code style={{ display: 'block', background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--text-primary)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
            X-API-Key: {data.apiKey}
          </code>
        </div>

        <div className="form-group">
          <label className="text-slate-700 font-semibold text-xs mb-1 flex items-center gap-1">
            <BookOpen size={12} className="text-primary" />
            Standard Payload Schema
          </label>
          <pre style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius)', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 150, border: '1px solid var(--border)', fontFamily: 'monospace' }} className="custom-scrollbar">
            {JSON.stringify(data.instructions?.samplePayload, null, 2)}
          </pre>
        </div>

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="select-none">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 bg-white border-slate-300 text-primary rounded" />
          <span>I have copied the token credentials safely for integration config.</span>
        </label>
      </div>
      <div className="modal-footer border-t border-slate-200 pt-3 mt-4">
        <button className="btn btn-primary" onClick={onClose} disabled={!confirmed}>
          Finalize Setup
        </button>
      </div>
    </>
  );
}

/* ── Test Payload Tool ───────────────────────────────────────────────────── */
function TestPayloadTool({ sources, onResult, onRefresh }) {
  const [apiKey, setApiKey] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('5000000');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);

  async function runTest(e) {
    e.preventDefault();
    if (!apiKey) return alert('Enter an API key');
    setLoading(true);

    const payload = {
      name: name || 'Test User',
      phone: phone || `99${Math.floor(Math.random() * 90000000 + 10000000)}`,
      email: 'test@propcrm.io',
      budget,
      source,
      property_type: 'apartment',
      city: 'Mumbai',
      locality: 'Andheri West',
      message: 'Test lead from PropCRM integration tester',
    };

    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      onResult({ ok: res.ok, status: res.status, data, payload });
    } catch (err) {
      onResult({ ok: false, status: 0, data: { message: err.message }, payload });
    }
    setLoading(false);
    setTimeout(onRefresh, 800);
  }

  return (
    <div className="card bg-white border border-slate-200 shadow-sm">
      <div className="section-header border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        <Zap size={18} className="text-primary" />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }} className="text-slate-900">Simulate Webhook Trigger</h3>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.6 }}>
        Perform a live operational audit. Dispatches an artificial lead sync packet directly through the API validation gateway.
      </p>
      <form onSubmit={runTest} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="text-slate-700 font-semibold text-xs mb-1.5 block">Access Token API Key *</label>
          <input type="password" required value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="pk_xxxxxxxxxxxxxxxx..." className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
        </div>
        <div className="form-group">
          <label className="text-slate-700 font-semibold text-xs mb-1.5 block">Source Slug Target</label>
          <select value={source} onChange={e => setSource(e.target.value)} className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
            <option value="">Auto-detect from key metadata</option>
            {sources.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-row flex gap-4">
          <div className="form-group flex-1">
            <label className="text-slate-700 font-semibold text-xs mb-1.5 block">Simulation Lead Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Rajesh Kumar" className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
          </div>
          <div className="form-group flex-1">
            <label className="text-slate-700 font-semibold text-xs mb-1.5 block">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Blank = random phone" className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
          </div>
        </div>
        <div className="form-group">
          <label className="text-slate-700 font-semibold text-xs mb-1.5 block">Simulated Budget (INR)</label>
          <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="5000000" className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
        </div>
        <button type="submit" className="btn btn-primary flex items-center justify-center gap-1.5 py-2.5 mt-2" disabled={loading}>
          <Zap size={14} />
          {loading ? 'Dispatched webhook...' : 'Fire Live Payload Test'}
        </button>
      </form>
    </div>
  );
}
