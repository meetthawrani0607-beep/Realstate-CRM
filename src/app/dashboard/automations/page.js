'use client';
import { useState, useEffect } from 'react';
import { Zap, Plus, X, Play, Pause, Trash2, ChevronRight, MessageCircle, Mail, UserPlus, Bell } from 'lucide-react';

import { useSession } from 'next-auth/react';

const TRIGGER_LABELS = {
  new_lead: 'New Lead Created',
  status_change: 'Status Changed',
  visit_scheduled: 'Visit Scheduled',
};

const ACTION_LABELS = {
  send_whatsapp: { label: 'Send WhatsApp', icon: MessageCircle, color: '#25D366' },
  send_email: { label: 'Send Email', icon: Mail, color: '#4F6EF7' },
  assign_agent: { label: 'Assign Agent', icon: UserPlus, color: '#7C3AED' },
  notify: { label: 'Notify Team', icon: Bell, color: '#F59E0B' },
};

export default function AutomationsPage() {
  const { data: session } = useSession();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch('/api/automations')
      .then(r => r.json())
      .then(data => { setAutomations(data.automations || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleAutomation(id, isActive) {
    await fetch(`/api/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a));
  }

  async function createAutomation(data) {
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newAuto = await res.json();
      setAutomations(prev => [newAuto, ...prev]);
      setShowModal(false);
    }
  }

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Automations</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Configure workflows to automate lead management tasks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> New Workflow</button>
      </div>

      {/* Preset workflows info */}
      <div className="card" style={{ boxShadow: 'var(--shadow-card)', marginBottom: 24, background: 'linear-gradient(135deg, var(--primary-bg), var(--secondary-bg))', border: '1px solid rgba(79, 110, 247, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Built-in Portal Automation</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              When a lead arrives via portal webhook, PropCRM automatically: validates → deduplicates → assigns an agent (round-robin) → creates activity log → sends WhatsApp (if configured).
            </p>
          </div>
        </div>
      </div>

      {/* Automation Cards */}
      {automations.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {automations.map(auto => {
            const actions = JSON.parse(auto.actions || '[]');
            return (
              <div key={auto.id} className="card" style={{ boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{auto.name}</span>
                    <span className="badge" style={{
                      background: auto.isActive ? 'var(--success-bg)' : 'var(--bg-elevated)',
                      color: auto.isActive ? 'var(--success)' : 'var(--text-muted)',
                      fontSize: '0.68rem'
                    }}>
                      {auto.isActive ? '● Active' : '○ Paused'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600 }}>Trigger:</span> {TRIGGER_LABELS[auto.trigger] || auto.trigger}
                    <ChevronRight size={14} />
                    {actions.map((act, i) => {
                      const meta = ACTION_LABELS[act] || { label: act, icon: Zap, color: 'var(--text-muted)' };
                      const Icon = meta.icon;
                      return (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Icon size={13} style={{ color: meta.color }} /> {meta.label}
                          {i < actions.length - 1 && <ChevronRight size={12} />}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${auto.isActive ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => toggleAutomation(auto.id, auto.isActive)}
                >
                  {auto.isActive ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Enable</>}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ boxShadow: 'var(--shadow-card)', textAlign: 'center', padding: 60 }}>
          <Zap size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No custom automations</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Create a workflow to automate lead assignment, notifications, and follow-ups.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={14} /> Create Workflow</button>
        </div>
      )}

      {/* Create Automation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={18} style={{ color: 'var(--primary)' }} /> New Automation</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <AutomationForm onSave={createAutomation} onClose={() => setShowModal(false)} accountType={session?.user?.accountType} />
          </div>
        </div>
      )}
    </div>
  );
}

function AutomationForm({ onSave, onClose, accountType }) {
  const [form, setForm] = useState({ name: '', trigger: 'new_lead', actions: accountType === 'broker' ? ['notify'] : ['assign_agent'] });

  const toggleAction = (action) => {
    setForm(f => ({
      ...f,
      actions: f.actions.includes(action) ? f.actions.filter(a => a !== action) : [...f.actions, action],
    }));
  };

  const availableActions = Object.entries(ACTION_LABELS).filter(([key]) => {
    if (accountType === 'broker' && key === 'assign_agent') return false;
    return true;
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, actions: JSON.stringify(form.actions) }); }}>
      <div className="modal-body">
        <div className="form-group">
          <label>Workflow Name *</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. New Lead Auto-Assignment" />
        </div>
        <div className="form-group">
          <label>Trigger Event</label>
          <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}>
            <option value="new_lead">New Lead Created</option>
            <option value="status_change">Lead Status Changed</option>
            <option value="visit_scheduled">Site Visit Scheduled</option>
          </select>
        </div>
        <div className="form-group">
          <label>Actions (select all that apply)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {availableActions.map(([key, meta]) => {
              const Icon = meta.icon;
              const selected = form.actions.includes(key);
              return (
                <button key={key} type="button" onClick={() => toggleAction(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius)',
                    border: `1.5px solid ${selected ? meta.color : 'var(--border)'}`,
                    background: selected ? `${meta.color}12` : 'var(--bg-elevated)',
                    color: selected ? meta.color : 'var(--text-secondary)',
                    fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <Icon size={14} /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary"><Plus size={14} /> Create</button>
      </div>
    </form>
  );
}
