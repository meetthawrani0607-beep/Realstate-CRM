'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatCurrency, timeAgo, getInitials, LEAD_STATUSES, getStatusMeta } from '@/lib/utils';
import { Search, Download, Plus, X, Users, Filter, LayoutGrid, List, GripVertical } from 'lucide-react';

import { useSession } from 'next-auth/react';

const PIPELINE_COLUMNS = ['new', 'contacted', 'qualified', 'visit_scheduled', 'negotiation', 'closed_won'];

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // table | kanban
  const [draggedLead, setDraggedLead] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    const res = await fetch('/api/leads?limit=200');
    const data = await res.json();
    setLeads(data.leads || []);
    setLoading(false);
  }

  const filtered = leads.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) return false;
    if (statusFilter && l.status !== statusFilter) return false;
    if (scoreFilter && l.aiScore !== scoreFilter) return false;
    return true;
  });

  async function handleCreate(data) {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) { fetchLeads(); setShowModal(false); }
  }

  async function updateLeadStatus(leadId, newStatus) {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  }

  // Drag and drop handlers
  function handleDragStart(e, lead) {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, status) {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== status) {
      updateLeadStatus(draggedLead.id, status);
    }
    setDraggedLead(null);
  }

  function handleExport(mode = 'filtered') {
    let dataToExport = [];
    
    if (mode === 'all') dataToExport = leads;
    else if (mode === 'hot') dataToExport = leads.filter(l => l.aiScore === 'hot');
    else if (mode === 'won') dataToExport = leads.filter(l => l.status === 'closed_won');
    else dataToExport = filtered; // 'filtered' mode

    if (dataToExport.length === 0) {
      alert("No leads found for this export option.");
      return;
    }
    
    const headers = ['Name', 'Phone', 'Email', 'Budget', 'Status', 'Score', 'Source', 'City', 'Locality', 'Date Added'];
    const csvRows = [headers.join(',')];
    
    for (const lead of dataToExport) {
      const row = [
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${lead.budget || ''}"`,
        `"${lead.status || ''}"`,
        `"${lead.aiScore || ''}"`,
        `"${lead.source || ''}"`,
        `"${(lead.city || '').replace(/"/g, '""')}"`,
        `"${(lead.locality || '').replace(/"/g, '""')}"`,
        `"${new Date(lead.createdAt).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(','));
    }
    
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="page-body">
        <div className="skeleton skeleton-title" style={{ width: '20%', height: 20 }} />
        <div style={{ marginTop: 20 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 4 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-body animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Leads</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{filtered.length} total leads</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', height: '38px' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{ padding: '0 12px', height: '100%', background: viewMode === 'table' ? 'var(--primary)' : 'transparent', color: viewMode === 'table' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
              ><List size={16} /></button>
              <button
                onClick={() => setViewMode('kanban')}
                style={{ padding: '0 12px', height: '100%', background: viewMode === 'kanban' ? 'var(--primary)' : 'transparent', color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
              ><LayoutGrid size={16} /></button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ height: '38px', display: 'flex', alignItems: 'center' }}>
                <Download size={14} /> Export
              </button>
              {showExportMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', zIndex: 50, minWidth: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <button onClick={() => { handleExport('all'); setShowExportMenu(false); }} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50">All Leads</button>
                  <button onClick={() => { handleExport('filtered'); setShowExportMenu(false); }} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50">Current View (Filtered)</button>
                  <button onClick={() => { handleExport('hot'); setShowExportMenu(false); }} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50">Only Hot Leads 🔥</button>
                  <button onClick={() => { handleExport('won'); setShowExportMenu(false); }} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-primary)' }} className="hover:bg-slate-50">Closed Won Leads 🎉</button>
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ height: '38px', display: 'flex', alignItems: 'center' }}><Plus size={14} /> Add Lead</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} style={{ maxWidth: 150 }}>
            <option value="">All Scores</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">🟠 Warm</option>
            <option value="cold">🔵 Cold</option>
          </select>
        </div>

        {/* ── TABLE VIEW ── */}
        {viewMode === 'table' && (
          <div className="table-wrap animate-fade-in" style={{ boxShadow: 'var(--shadow-card)' }}>
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Phone</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Source</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <Link href={`/dashboard/leads/${lead.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 34, height: 34, fontSize: '0.72rem' }}>
                          {getInitials(lead.name)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.name}</span>
                          {lead.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</div>}
                        </div>
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{lead.phone}</td>
                    <td style={{ fontWeight: 600 }}>{lead.budget ? formatCurrency(lead.budget, true) : '—'}</td>
                    <td><span className={`badge badge-${lead.status}`}>{getStatusMeta(lead.status).label}</span></td>
                    <td>{lead.aiScore && <span className={`badge badge-${lead.aiScore}`}>{lead.aiScore}</span>}</td>
                    <td style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{lead.source || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{timeAgo(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No leads found</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>Try adjusting your filters or add a new lead.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={14} /> Add Lead</button>
              </div>
            )}
          </div>
        )}

        {/* ── KANBAN VIEW ── */}
        {viewMode === 'kanban' && (
          <div className="kanban-board animate-fade-in">
            {PIPELINE_COLUMNS.map(status => {
              const meta = getStatusMeta(status);
              const columnLeads = filtered.filter(l => l.status === status);
              return (
                <div
                  key={status}
                  className="kanban-column"
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, status)}
                >
                  <div className="kanban-column-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color }} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{meta.label}</span>
                    </div>
                    <span style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                    }}>{columnLeads.length}</span>
                  </div>
                  <div className="kanban-column-body" style={{ minHeight: 100 }}>
                    {columnLeads.map(lead => (
                      <div
                        key={lead.id}
                        className="kanban-card"
                        draggable
                        onDragStart={e => handleDragStart(e, lead)}
                        style={{ opacity: draggedLead?.id === lead.id ? 0.4 : 1 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />
                          <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.6rem' }}>
                            {getInitials(lead.name)}
                          </div>
                          <Link href={`/dashboard/leads/${lead.id}`} style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lead.name}
                          </Link>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.phone}</span>
                          {lead.budget && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(lead.budget, true)}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          {lead.aiScore && <span className={`badge badge-${lead.aiScore}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{lead.aiScore}</span>}
                          {lead.source && <span className="badge badge-outline" style={{ fontSize: '0.65rem', padding: '2px 8px', textTransform: 'capitalize' }}>{lead.source}</span>}
                        </div>
                      </div>
                    ))}
                    {columnLeads.length === 0 && (
                      <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                        Drop leads here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} style={{ color: 'var(--primary)' }} /> Add New Lead</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <LeadForm onSave={handleCreate} onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function LeadForm({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', budget: '', source: 'website', propertyType: '', city: '', locality: '', notes: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, budget: form.budget ? Number(form.budget) : null }); }}>
      <div className="modal-body">
        <div className="form-row">
          <div className="form-group"><label>Full Name *</label><input required value={form.name} onChange={set('name')} placeholder="Enter full name" /></div>
          <div className="form-group"><label>Phone *</label><input required value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" /></div>
          <div className="form-group"><label>Budget (₹)</label><input type="number" value={form.budget} onChange={set('budget')} placeholder="e.g. 5000000" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Source</label>
            <select value={form.source} onChange={set('source')}>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="magicbricks">MagicBricks</option>
              <option value="99acres">99acres</option>
              <option value="housing">Housing.com</option>
              <option value="facebook">Facebook Ads</option>
              <option value="walkin">Walk-in</option>
            </select>
          </div>
          <div className="form-group"><label>Property Type</label>
            <select value={form.propertyType} onChange={set('propertyType')}>
              <option value="">Select type</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="plot">Plot</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>City</label><input value={form.city} onChange={set('city')} placeholder="Mumbai" /></div>
          <div className="form-group"><label>Locality</label><input value={form.locality} onChange={set('locality')} placeholder="Andheri West" /></div>
        </div>
        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={set('notes')} placeholder="Additional context..." /></div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary"><Plus size={14} /> Add Lead</button>
      </div>
    </form>
  );
}
