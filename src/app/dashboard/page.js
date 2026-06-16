'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, timeAgo, getInitials, getStatusMeta } from '@/lib/utils';
import { 
  Users, BarChart3, Home, TrendingUp, 
  DollarSign, Eye, CheckCircle2, ArrowUpRight, ArrowRight,
  Calendar, Building2, Target, Flame, UserCheck
} from 'lucide-react';

function StatCard({ label, value, sub, icon, iconColor }) {
  return (
    <div className="card stat-card" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="stat-card-body">
        <div className="stat-card-info">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value ?? '—'}</div>
          {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>{sub}</div>}
        </div>
        <div className="stat-card-icon" style={{ background: `${iconColor}14`, color: iconColor }}>
          {icon}
        </div>
      </div>
    </div>
  );
}


function SourceChart({ sources }) {
  const max = Math.max(...sources.map(s => s.count), 1);
  const colors = ['var(--primary)', 'var(--secondary)', 'var(--success)', 'var(--warning)', 'var(--pink)', 'var(--teal)', 'var(--danger)'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sources.slice(0, 6).map((s, i) => (
        <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 90, fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {s.source}
          </span>
          <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <div style={{
              width: `${(s.count / max) * 100}%`,
              height: '100%',
              borderRadius: 99,
              background: colors[i % colors.length],
              transition: 'width 0.6s ease',
            }} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 28, textAlign: 'right' }}>
            {s.count}
          </span>
        </div>
      ))}
    </div>
  );
}

import { useSession } from 'next-auth/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

function RevenueChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPipe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `₹${(val/10000000).toFixed(1)}Cr`} dx={-10} />
          <RechartsTooltip 
            contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '12px 16px' }}
            formatter={(value) => formatCurrency(value, true)}
          />
          <Area type="monotone" dataKey="pipeline" name="Pipeline Value" stroke="var(--secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPipe)" />
          <Area type="monotone" dataKey="revenue" name="Closed Revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FunnelChart({ pipeline }) {
  if (!pipeline || pipeline.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={pipeline} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
          <XAxis type="number" hide />
          <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 600 }} width={100} />
          <RechartsTooltip 
            cursor={{ fill: 'var(--bg-hover)' }}
            contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          />
          <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]} barSize={24}>
            {pipeline.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="skeleton" style={{ width: '35%', height: 28, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ width: '50%', height: 16, borderRadius: 'var(--radius)' }} />
          <div className="stats-grid" style={{ marginTop: 8 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-stat" />)}
          </div>
        </div>
      </div>
    );
  }

  const s = stats || {};

  return (
    <div className="page-body animate-fade-in">
      {/* Page Title */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Dashboard
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Real-time overview of your leads, revenue, and pipeline performance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard label="Total Leads" value={s.totalLeads} icon={<Users size={22} />} iconColor="var(--blue)" sub={`${s.newToday || 0} new today`} />
        <StatCard label="Active Deals" value={s.activeDeals} icon={<Target size={22} />} iconColor="var(--secondary)" sub={`${s.newThisWeek || 0} this week`} />
        <StatCard label="Conversion Rate" value={`${s.conversionRate || 0}%`} icon={<TrendingUp size={22} />} iconColor="var(--success)" sub={`${s.closedWon || 0} closed won`} />
        <StatCard label="Revenue" value={formatCurrency(s.revenue, true)} icon={<DollarSign size={22} />} iconColor="var(--warning)" sub={`Pipeline: ${formatCurrency(s.pipelineValue, true)}`} />
      </div>

      {/* Revenue Forecast Chart */}
      <div className="card" style={{ boxShadow: 'var(--shadow-card)', marginBottom: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Revenue Forecast</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Projected pipeline value vs realized closed won revenue.</p>
        </div>
        {s.historicalRevenue && <RevenueChart data={s.historicalRevenue} />}
      </div>

      {/* Pipeline + Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Pipeline Funnel */}
        <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Lead Funnel</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Drop-off across sales stages</p>
            </div>
            <Link href="/dashboard/pipeline" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
               Pipeline <ArrowRight size={14} />
            </Link>
          </div>
          {s.pipeline && <FunnelChart pipeline={s.pipeline} />}
        </div>

        {/* Source Performance & Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {s.leaderboard && s.leaderboard.length > 0 && (
            <div className="card" style={{ boxShadow: 'var(--shadow-card)', flex: 1 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Agent Leaderboard</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Top performers by closed won</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s.leaderboard.slice(0, 5).map((agent, i) => (
                  <div key={agent.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'var(--warning)' : i === 1 ? '#9CA3AF' : i === 2 ? '#B45309' : 'var(--bg-card)', color: i < 3 ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{agent.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{agent.assigned} Leads</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>{agent.won}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Won</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ boxShadow: 'var(--shadow-card)', flex: s.leaderboard ? 0 : 1 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Lead Sources</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Where your best leads come from</p>
            </div>
            {s.sources && s.sources.length > 0 ? (
              <SourceChart sources={s.sources} />
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No source data available yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Recent Leads</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Latest additions to your pipeline</p>
          </div>
          <Link href="/dashboard/leads" className="btn btn-primary btn-sm" style={{ gap: 4 }}>
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Source</th>
                <th>Status</th>
                <th>Budget</th>
                {session?.user?.accountType !== 'broker' && <th>Agent</th>}
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(s.recentLeads || []).map(lead => {
                const statusMeta = getStatusMeta(lead.status);
                return (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.68rem' }}>
                          {getInitials(lead.name)}
                        </div>
                        <div>
                          <Link href={`/dashboard/leads/${lead.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                            {lead.name}
                          </Link>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{lead.source || '—'}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${lead.status}`}>{statusMeta.label}</span>
                    </td>
                    <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {lead.budget ? formatCurrency(lead.budget, true) : '—'}
                    </td>
                    {session?.user?.accountType !== 'broker' && (
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {lead.assignedTo?.name || '—'}
                      </td>
                    )}
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {timeAgo(lead.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {(!s.recentLeads || s.recentLeads.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No leads yet. Import or create your first lead to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
