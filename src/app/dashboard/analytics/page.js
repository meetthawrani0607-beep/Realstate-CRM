'use client';
import { useState, useEffect } from 'react';
import { formatCurrency, getStatusMeta, LEAD_STATUSES } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, Target, Calendar, Building2, ArrowUpRight } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-body">
        <div className="skeleton" style={{ width: '30%', height: 28, borderRadius: 'var(--radius)', marginBottom: 20 }} />
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-stat" />)}
        </div>
      </div>
    );
  }

  const s = stats || {};
  const totalClosed = (s.closedWon || 0) + (s.closedLost || 0);
  const winRate = totalClosed > 0 ? Math.round(((s.closedWon || 0) / totalClosed) * 100) : 0;

  return (
    <div className="page-body animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Analytics</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Data-driven insights from your real estate pipeline.</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <KpiCard label="Total Leads" value={s.totalLeads} icon={<Users size={20} />} color="var(--primary)" />
        <KpiCard label="Win Rate" value={`${winRate}%`} icon={<TrendingUp size={20} />} color="var(--success)" />
        <KpiCard label="Closed Revenue" value={formatCurrency(s.revenue, true)} icon={<Target size={20} />} color="var(--warning)" />
        <KpiCard label="Pipeline Value" value={formatCurrency(s.pipelineValue, true)} icon={<BarChart3 size={20} />} color="var(--secondary)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Conversion Funnel */}
        <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Conversion Funnel</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>Lead progression through pipeline stages</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(s.pipeline || []).map((stage, i) => {
              const maxCount = Math.max(...(s.pipeline || []).map(st => st.count), 1);
              return (
                <div key={stage.value}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{stage.label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stage.count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{ width: `${(stage.count / maxCount) * 100}%`, height: '100%', borderRadius: 99, background: stage.color, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Performance */}
        <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Source Performance</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>Lead acquisition by channel</p>
          {s.sources && s.sources.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {s.sources.map((src, i) => {
                const max = Math.max(...s.sources.map(s => s.count), 1);
                const colors = ['var(--primary)', 'var(--secondary)', 'var(--success)', 'var(--warning)', 'var(--pink)', 'var(--teal)'];
                return (
                  <div key={src.source}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{src.source}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{src.count} leads</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                      <div style={{ width: `${(src.count / max) * 100}%`, height: '100%', borderRadius: 99, background: colors[i % colors.length], transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No source data</div>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Activity Summary</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>Key performance metrics at a glance</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { label: 'New This Week', value: s.newThisWeek || 0, color: 'var(--primary)' },
            { label: 'New This Month', value: s.newThisMonth || 0, color: 'var(--secondary)' },
            { label: 'Visits This Week', value: s.visitsThisWeek || 0, color: 'var(--pink)' },
            { label: 'Closed Won', value: s.closedWon || 0, color: 'var(--success)' },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center', padding: 20, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'default' }}
                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: m.color, fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div className="card stat-card" style={{ boxShadow: 'var(--shadow-card)', background: 'var(--bg-card)', transition: 'transform 0.2s, box-shadow 0.2s' }}
         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
         onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}>
      <div className="stat-card-body">
        <div className="stat-card-info">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value ?? '—'}</div>
        </div>
        <div className="stat-card-icon" style={{ background: `${color}1A`, color, border: `1px solid ${color}33` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
