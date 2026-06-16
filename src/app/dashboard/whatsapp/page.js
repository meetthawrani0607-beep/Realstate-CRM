'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getInitials, formatCurrency, timeAgo } from '@/lib/utils';
import { MessageSquare, Send, Search, Sparkles, History, User, ExternalLink, ArrowUpRight, ArrowDownLeft, ChevronLeft } from 'lucide-react';

const TEMPLATES = [
  { name: '👋 Welcome', content: 'Hi {{name}}, thank you for your interest! I\'m your property advisor at Horizon Realty. How can I help you find your dream home?' },
  { name: '📋 Follow Up', content: 'Hi {{name}}, just checking in! Have you had a chance to review the properties I shared? Happy to schedule a site visit at your convenience.' },
  { name: '📅 Visit Confirm', content: 'Hi {{name}}, your site visit is confirmed! Looking forward to showing you the property. Please let me know if you need to reschedule.' },
  { name: '🏠 Property Share', content: 'Hi {{name}}, I found some great options matching your budget of {{budget}}. Would you like me to share the details?' },
  { name: '🙏 Post Visit', content: 'Hi {{name}}, hope you liked the property! Let me know your thoughts or if you\'d like to explore other options.' },
  { name: '💰 Offer', content: 'Hi {{name}}, great news! The builder is offering a special discount this month. Shall we discuss the numbers?' },
];

function openWhatsApp(phone, message) {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const fullPhone = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
}

export default function WhatsAppPage() {
  const searchParams = useSearchParams();
  const [allLeads, setAllLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [showMobileList, setShowMobileList] = useState(true);

  useEffect(() => {
    fetch('/api/leads?limit=200').then(r => r.json()).then(d => {
      const leads = d.leads || [];
      setAllLeads(leads);
      setFilteredLeads(leads);
      const pre = searchParams.get('lead');
      if (pre) { const found = leads.find(l => l.id === pre); if (found) selectLead(found); }
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredLeads(allLeads); return; }
    const q = searchQuery.toLowerCase();
    setFilteredLeads(allLeads.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q)));
  }, [searchQuery, allLeads]);

  function selectLead(lead) {
    setSelected(lead);
    setMessage('');
    setShowMobileList(false);
    fetch(`/api/whatsapp/messages?leadId=${lead.id}`).then(r => r.json()).then(d => setLogs(d.messages || []));
  }

  function fillTemplate(tpl) {
    const filled = tpl.content
      .replace(/\{\{name\}\}/g, selected?.name || '')
      .replace(/\{\{budget\}\}/g, selected?.budget ? formatCurrency(selected.budget, true) : 'your budget');
    setMessage(filled);
  }

  async function sendViaWhatsApp() {
    if (!message.trim() || !selected) return;
    openWhatsApp(selected.phone, message);
    await fetch('/api/whatsapp/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selected.id, phone: selected.phone, message }),
    });
    const d = await fetch(`/api/whatsapp/messages?leadId=${selected.id}`).then(r => r.json());
    setLogs(d.messages || []);
    setMessage('');
  }

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="page-header mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <MessageSquare size={24} className="text-emerald-500" />
            WhatsApp Communication Hub
          </h2>
          <p className="text-sm text-gray-400 mt-1">Send template-based quick messages or customized follow-ups to your leads.</p>
        </div>
      </div>

      <div className="chat-layout flex border border-slate-800/60 rounded-xl overflow-hidden bg-slate-950/40 backdrop-blur-md" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Contact List */}
        <div className={`chat-list w-80 border-r border-slate-800/60 flex flex-col bg-slate-900/10 ${!showMobileList ? 'mobile-hidden' : 'mobile-w-full'}`}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div className="search-bar">
              <Search size={14} className="text-slate-500" />
              <input placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredLeads.map(lead => (
              <div key={lead.id} className={`chat-list-item ${selected?.id === lead.id ? 'active' : ''}`} onClick={() => selectLead(lead)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <div className="user-avatar" style={{
                    width: 38, height: 38, fontSize: '0.78rem', fontWeight: 600,
                    background: selected?.id === lead.id ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'var(--bg-elevated)',
                    color: '#fff',
                    border: '1px solid var(--border)'
                  }}>
                    {getInitials(lead.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 className="font-semibold text-slate-200 text-sm truncate m-0">{lead.name}</h5>
                      {lead.aiScore && (
                        <span className={`badge badge-${lead.aiScore} shrink-0 text-[10px] py-0.5 px-1.5`} style={{ fontSize: '0.6rem' }}>
                          {lead.aiScore}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1 mb-0">{lead.phone}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredLeads.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-sm">
                No contacts found
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`chat-panel flex-1 flex flex-col bg-slate-950/20 ${showMobileList ? 'mobile-hidden' : ''}`}>
          {selected ? (
            <>
              {/* Chat Header */}
              <div className="chat-header border-b border-slate-800/60 p-4 flex items-center justify-between bg-slate-900/20">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="btn-icon mobile-only text-slate-400 -ml-2" onClick={() => setShowMobileList(true)}>
                    <ChevronLeft size={20} />
                  </button>
                  <div className="user-avatar" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', color: '#fff', fontWeight: 600 }}>
                    {getInitials(selected.name)}
                  </div>
                  <div>
                    <strong className="text-white text-base block">{selected.name}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} className="flex items-center gap-1.5 mt-0.5">
                      <span>{selected.phone}</span>
                      {selected.budget && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-primary font-medium">{formatCurrency(selected.budget, true)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => openWhatsApp(selected.phone, '')}>
                    <ExternalLink size={12} />
                    Open WhatsApp
                  </button>
                  <a href={`/dashboard/leads/${selected.id}`} className="btn btn-ghost btn-sm text-slate-400 hover:text-white hover:bg-slate-900 flex items-center gap-1 mobile-hidden">
                    View Lead Profile
                    <ArrowUpRight size={12} />
                  </a>
                </div>
              </div>

              {/* Templates */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                  Quick AI & SaaS Templates
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.name} 
                      onClick={() => fillTemplate(t)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-card)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Composer */}
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }} className="overflow-y-auto">
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 16, border: '1px solid var(--border)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={`Compose customized message to ${selected.name}...`}
                    style={{ width: '100%', flex: 1, minHeight: 120, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '0.93rem', lineHeight: 1.6, color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opens official WhatsApp API window with text pre-filled.</span>
                  <button className="btn btn-primary flex items-center gap-2" onClick={sendViaWhatsApp} disabled={!message.trim()} style={{ minWidth: 180 }}>
                    <Send size={14} />
                    Send via WhatsApp
                  </button>
                </div>
              </div>

              {/* Message History */}
              {logs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', maxHeight: 220, overflowY: 'auto', background: 'rgba(15, 23, 42, 0.6)' }} className="custom-scrollbar">
                  <div style={{ fontSize: '0.71rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <History size={12} className="text-slate-400" />
                    Communication Log
                  </div>
                  <div className="flex flex-col gap-3">
                    {logs.map(m => (
                      <div key={m.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.78rem' }} className={`flex items-center gap-1 ${m.direction === 'outbound' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                            {m.direction === 'outbound' ? (
                              <>
                                <ArrowUpRight size={12} />
                                Sent (WhatsApp Web redirect)
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft size={12} />
                                Inbound Hook Received
                              </>
                            )}
                          </span>
                          <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>{timeAgo(m.createdAt)}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{m.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-emerald-400 animate-pulse">
                <MessageSquare size={32} className="stroke-[1.5]" />
              </div>
              <h3 className="text-white text-lg font-bold m-0">No Conversation Selected</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: 340, textAlign: 'center', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                Select a lead from the contact sidebar to access quick-templates, AI assistants, and outbound messaging history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
