'use client';
import { useState, useEffect } from 'react';
import { getInitials, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { UsersRound, Shield, UserPlus, X, Mail, Phone, Calendar, Briefcase, ChevronRight } from 'lucide-react';

const ROLE_LABELS = {
  super_admin: { label: 'Super Admin', bg: 'var(--danger-bg)', color: 'var(--danger)' },
  agency_admin: { label: 'Agency Admin', bg: 'var(--purple-bg)', color: 'var(--purple)' },
  manager: { label: 'Manager', bg: 'var(--blue-bg)', color: 'var(--blue)' },
  admin: { label: 'Admin', bg: 'var(--purple-bg)', color: 'var(--purple)' },
  agent: { label: 'Agent', bg: 'var(--success-bg)', color: 'var(--success)' },
};

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      const r = await fetch('/api/settings');
      const data = await r.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(formData) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      fetchTeam();
      setShowInviteModal(false);
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to invite user');
    }
  }

  if (loading) {
    return (
      <div className="page-body">
        <div className="skeleton" style={{ width: '20%', height: 28, borderRadius: 'var(--radius)', marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Team</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{users.length} team members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
          <UserPlus size={16} />
          Invite Member
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {users.map(user => {
          const role = ROLE_LABELS[user.role] || ROLE_LABELS.agent;
          return (
            <div 
              key={user.id} 
              className="card" 
              style={{ 
                boxShadow: 'var(--shadow-card)', 
                display: 'flex', 
                gap: 16, 
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onClick={() => setSelectedUser(user)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div className="user-avatar" style={{ width: 48, height: 48, fontSize: '0.9rem', flexShrink: 0 }}>
                {getInitials(user.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{user.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <Mail size={12} /> {user.email}
                </div>
                <span className="badge" style={{ background: role.bg, color: role.color }}>{role.label}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                <ChevronRight size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div style={{ padding: 80, textAlign: 'center' }}>
          <UsersRound size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No team members</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Invite your first team member to get started.</p>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-elevated))', padding: '32px 24px', textAlign: 'center', position: 'relative', borderBottom: '1px solid var(--border)' }}>
              <button className="btn-icon" onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: 16, right: 16 }}>
                <X size={16} />
              </button>
              
              <div className="user-avatar" style={{ width: 72, height: 72, fontSize: '1.5rem', margin: '0 auto 16px', background: 'var(--primary)', color: '#fff' }}>
                {getInitials(selectedUser.name)}
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{selectedUser.name}</h3>
              <span className="badge" style={{ background: (ROLE_LABELS[selectedUser.role] || ROLE_LABELS.agent).bg, color: (ROLE_LABELS[selectedUser.role] || ROLE_LABELS.agent).color }}>
                {(ROLE_LABELS[selectedUser.role] || ROLE_LABELS.agent).label}
              </span>
            </div>
            
            <div style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}>Contact Information</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Email Address</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.email}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Phone size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Phone Number</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.phone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}>Account Details</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Joined Date</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Assigned Leads</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedUser._count?.assignedLeads || 0} active leads
                    </div>
                  </div>
                </div>
              </div>

              {selectedUser._count?.assignedLeads > 0 && (
                <UserLeads userId={selectedUser.id} />
              )}
            </div>
            
            <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={18} style={{ color: 'var(--primary)' }} /> Invite Team Member</h3>
              <button className="btn-icon" onClick={() => setShowInviteModal(false)}><X size={16} /></button>
            </div>
            <InviteForm onSave={handleInvite} onClose={() => setShowInviteModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function InviteForm({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'agent', password: '' });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    onSave(form).finally(() => setLoading(false));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label>Full Name *</label>
          <input required value={form.name} onChange={set('name')} placeholder="e.g. John Doe" />
        </div>
        <div className="form-group">
          <label>Email Address *</label>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
        </div>
        <div className="form-group">
          <label>Role *</label>
          <select required value={form.role} onChange={set('role')}>
            <option value="agent">Agent</option>
            <option value="manager">Manager</option>
            <option value="agency_admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label>Temporary Password *</label>
          <input required type="password" value={form.password} onChange={set('password')} placeholder="Minimum 6 characters" minLength={6} />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Invite Member'}
        </button>
      </div>
    </form>
  );
}

function UserLeads({ userId }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leads?assignedToId=${userId}&limit=5`)
      .then(r => r.json())
      .then(d => {
        setLeads(d.leads || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading active leads...</div>;
  if (leads.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}>Recent Active Leads</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leads.map(lead => (
          <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} style={{
            display: 'block', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textDecoration: 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{lead.name}</span>
              <span className={`badge badge-${lead.status}`} style={{ fontSize: '0.65rem' }}>{lead.status.replace('_', ' ')}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
              <span>{lead.phone}</span>
              {lead.budget && <span>₹{lead.budget.toLocaleString()}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
