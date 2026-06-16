'use client';
import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Loader2, Users, Building2, BarChart3, TrendingUp } from 'lucide-react';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your PropCRM AI Assistant. I can help you analyze leads, suggest follow-ups, score prospects, and recommend properties. Ask me anything about your CRM data.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(setStats);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'I couldn\'t process that request.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your AI API key configuration in Settings.' }]);
    }
    setLoading(false);
  }

  const quickPrompts = [
    { label: 'Summarize pipeline', prompt: 'Give me a summary of the current lead pipeline status.' },
    { label: 'Hot leads today', prompt: 'Which leads should I prioritize contacting today?' },
    { label: 'Follow-up suggestions', prompt: 'What follow-up actions do you recommend for leads that haven\'t been contacted in 3+ days?' },
    { label: 'Property match', prompt: 'Which properties would be a good match for leads with budgets over 50 lakhs?' },
  ];

  return (
    <div className="page-body animate-fade-in" style={{ display: 'flex', gap: 24, height: 'calc(100vh - var(--header-h) - 56px)' }}>
      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>AI Assistant</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Powered by your CRM data. Ask questions, get insights.</p>
        </div>

        {/* Messages */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={16} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '12px 24px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about leads, properties, follow-ups..."
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar with quick prompts and stats */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Quick Prompts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {quickPrompts.map((qp, i) => (
              <button key={i} onClick={() => { setInput(qp.prompt); }} style={{
                textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>CRM Context</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: Users, label: 'Total Leads', value: stats.totalLeads, color: 'var(--blue)' },
                { icon: TrendingUp, label: 'Active Deals', value: stats.activeDeals, color: 'var(--purple)' },
                { icon: Building2, label: 'Properties', value: stats.totalProperties, color: 'var(--teal)' },
                { icon: BarChart3, label: 'Win Rate', value: `${stats.conversionRate}%`, color: 'var(--success)' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <Icon size={16} style={{ color: item.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
