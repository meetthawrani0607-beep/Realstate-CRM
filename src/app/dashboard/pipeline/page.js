'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, getInitials, LEAD_STATUSES } from '@/lib/utils';
import { List, Phone, IndianRupee, GripVertical } from 'lucide-react';

const PIPELINE_COLORS = {
  new: '#3B82F6',
  contacted: '#06B6D4',
  qualified: '#8B5CF6',
  visit_done: '#F59E0B',
  negotiation: '#EC4899',
  won: '#22C55E',
  lost: '#EF4444',
};

export default function PipelinePage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => {
    fetch('/api/leads?limit=200').then(r => r.json()).then(d => { setLeads(d.leads || []); setLoading(false); });
  }, []);

  const columns = LEAD_STATUSES.filter(s => s.value !== 'closed_lost');

  function handleDragStart(e, lead) {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  }

  async function handleDrop(e, status) {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedLead || draggedLead.status === status) return;
    setLeads(prev => prev.map(l => l.id === draggedLead.id ? { ...l, status } : l));
    await fetch(`/api/leads/${draggedLead.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setDraggedLead(null);
  }

  if (loading) {
    return (
      <div className="page-body">
        <div style={{ display: 'flex', gap: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ width: 290, height: 400, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Pipeline</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>Drag leads between stages</p>
          </div>
          <Link href="/dashboard/leads" className="btn btn-secondary btn-sm">
            <List size={14} />
            List View
          </Link>
        </div>

        <div className="kanban-board animate-fade-in">
          {columns.map(col => {
            const colLeads = leads.filter(l => l.status === col.value);
            const color = PIPELINE_COLORS[col.value] || '#64748B';
            return (
              <div key={col.value}
                className={`kanban-column ${dragOverCol === col.value ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOverCol(col.value); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={e => handleDrop(e, col.value)}>
                <div className="kanban-column-header">
                  <div className="kanban-column-accent" style={{ background: color }} />
                  <h4>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}40` }} />
                    {col.label}
                    <span className="count">{colLeads.length}</span>
                  </h4>
                </div>
                <div className="kanban-cards">
                  {colLeads.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '28px 12px', color: 'var(--text-muted)', fontSize: '0.82rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', background: 'rgba(59, 130, 246, 0.03)' }}>
                      Drop leads here
                    </div>
                  )}
                  {colLeads.map(lead => (
                    <div key={lead.id}
                      className={`kanban-card ${draggedLead?.id === lead.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={e => handleDragStart(e, lead)}
                      onDragEnd={() => setDraggedLead(null)}>
                      <Link href={`/dashboard/leads/${lead.id}`}>
                        <h5>{lead.name}</h5>
                        <div className="kanban-card-meta">
                          <span><Phone size={12} /> {lead.phone}</span>
                          {lead.budget && <span><IndianRupee size={12} /> {formatCurrency(lead.budget, true)}</span>}
                        </div>
                        <div className="kanban-card-footer">
                          <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.58rem' }}>
                            {getInitials(lead.name)}
                          </div>
                          {lead.aiScore && <span className={`badge badge-${lead.aiScore}`} style={{ fontSize: '0.6rem' }}>{lead.aiScore}</span>}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
