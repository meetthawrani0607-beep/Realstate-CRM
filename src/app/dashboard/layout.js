'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Providers from '../providers';
import Sidebar from '@/components/layout/Sidebar';
import {
  Search,
  Mail,
  Bell,
  Sparkles,
  X,
  Menu,
  Send,
  Flame,
  BarChart3,
  Zap,
  Plus,
  CalendarDays,
  Columns3,
  MessageCircle,
  Users,
  Building2,
  Settings,
} from 'lucide-react';

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';
}

function Topbar({ user, onToggleAI, aiOpen, onToggleSidebar }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [lastRead, setLastRead] = useState(null);

  const [readFeedback, setReadFeedback] = useState(false);

  useEffect(() => {
    // Check localStorage for last read timestamp
    const stored = localStorage.getItem('propcrm_notifs_read');
    if (stored) setLastRead(new Date(stored));

    // Fetch initial notifications for unread indicator
    fetchNotifications();

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchNotifications = () => {
    setLoadingNotifs(true);
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .finally(() => setLoadingNotifs(false));
  };

  const markAllRead = () => {
    const now = new Date();
    setLastRead(now);
    localStorage.setItem('propcrm_notifs_read', now.toISOString());
    setReadFeedback(true);
    setTimeout(() => setReadFeedback(false), 2000);
  };

  const hasUnread = notifications.some(n => !lastRead || new Date(n.time) > lastRead);

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn-icon mobile-toggle" onClick={onToggleSidebar}>
            <Menu size={20} />
          </button>
          <div className="topbar-search" onClick={() => setCmdOpen(true)} style={{ cursor: 'text' }}>
            <Search size={16} className="search-icon" />
            <input placeholder="Search leads, properties..." readOnly style={{ pointerEvents: 'none' }} />
            <span className="shortcut-hint">Ctrl K</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="btn-icon" title="Messages" style={{ position: 'relative' }} onClick={() => window.location.href = '/dashboard/whatsapp'}>
            <Mail size={18} />
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              className="btn-icon" 
              title="Notifications" 
              onClick={() => {
                const isOpening = !notifOpen;
                setNotifOpen(isOpening);
                if (isOpening) fetchNotifications();
              }}
              style={notifOpen ? { color: 'var(--primary)', background: 'var(--primary-bg)' } : {}}
            >
              <Bell size={18} />
              {hasUnread && <span className="notification-dot" />}
            </button>
            
            {notifOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setNotifOpen(false)} />
                <div className="animate-scale-in" onClick={e => e.stopPropagation()} style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 340, 
                  background: 'var(--bg-card)', border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', 
                  zIndex: 100, overflow: 'hidden' 
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</h3>
                    <span onClick={(e) => { e.stopPropagation(); markAllRead(); }} style={{ fontSize: '0.7rem', color: readFeedback ? 'var(--success)' : 'var(--primary)', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s' }}>
                      {readFeedback ? '✓ Marked as read' : 'Mark all read'}
                    </span>
                  </div>
                  
                  <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                    {loadingNotifs && notifications.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No recent notifications.</div>
                    ) : notifications.map(n => {
                      const isUnread = !lastRead || new Date(n.time) > lastRead;
                      return (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (n.leadId) window.location.href = `/dashboard/leads/${n.leadId}`;
                            setNotifOpen(false);
                          }}
                          style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid var(--border)', 
                            display: 'flex', gap: 12, 
                            transition: 'background 0.2s', cursor: 'pointer',
                            background: isUnread ? 'var(--primary-bg)' : 'transparent'
                          }} 
                          onMouseEnter={e => e.currentTarget.style.background = isUnread ? 'var(--primary-bg)' : 'var(--bg-hover)'} 
                          onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'var(--primary-bg)' : 'transparent'}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isUnread ? 'var(--primary)' : 'var(--border)', marginTop: 6, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                            {n.content && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{n.content}</div>}
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(n.time).toLocaleDateString()} {new Date(n.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div onClick={() => { window.location.href = '/dashboard/leads'; setNotifOpen(false); }} style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, background: 'var(--bg-surface)' }}>
                    View All Leads
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            className="btn-icon"
            onClick={onToggleAI}
            title="AI Assistant"
            style={aiOpen ? { color: 'var(--primary)', background: 'var(--primary-bg)' } : {}}
          >
            <Sparkles size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
            <div className="user-avatar" style={{ width: 36, height: 36 }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'User'}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{user?.accountType === 'broker' ? 'Individual Broker' : user?.role || 'CRM Agent'}</span>
            </div>
          </div>
        </div>
      </div>

      {cmdOpen && (
        <div className="modal-overlay" onClick={() => setCmdOpen(false)} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <Search size={20} className="text-slate-400" style={{ marginRight: 12 }} />
              <input 
                autoFocus 
                placeholder="Search leads, settings, properties..." 
                style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '1.1rem', outline: 'none', padding: 0, boxShadow: 'none' }} 
              />
              <button className="btn-icon" onClick={() => setCmdOpen(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: '16px 20px', minHeight: 200, background: 'var(--bg-elevated)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a href="/dashboard/leads" className="nav-item">
                  <Users size={16} /> <span>View All Leads</span>
                </a>
                <a href="/dashboard/properties" className="nav-item">
                  <Building2 size={16} /> <span>Browse Properties</span>
                </a>
                <a href="/dashboard/settings" className="nav-item">
                  <Settings size={16} /> <span>System Settings</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AIAssistantPanel({ open, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && suggestions.length === 0 && !loading) {
      setLoading(true);
      fetch('/api/ai/insights')
        .then(res => res.json())
        .then(data => {
          if (data.suggestions) setSuggestions(data.suggestions);
          if (data.followups) setFollowups(data.followups);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  // Map icon strings from API to Lucide components
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'CalendarDays': return CalendarDays;
      case 'Bell': return Bell;
      case 'BarChart3': return BarChart3;
      default: return Zap;
    }
  };

  return (
    <div className={`ai-panel ${open ? 'open' : ''}`}>
      <div className="ai-panel-header">
        <h3>
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          AI Assistant
          <span className="ai-badge">Beta</span>
        </h3>
        <button className="btn-icon" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="ai-panel-body">
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-bg), var(--secondary-bg))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 16,
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Hi! I can help you identify hot leads, suggest follow-ups, and optimize your pipeline.
          </p>
        </div>

        <div className="ai-suggestion-card">
          <h4><Flame size={14} style={{ color: 'var(--danger)' }} /> Hot Leads to Contact</h4>
          {loading ? (
            <div style={{ padding: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analyzing database...</div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>No hot leads found yet.</div>
          ) : suggestions.filter(s => s.type === 'hot').map((s, i) => (
            <div key={i} className="ai-suggestion-item">
              <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                {s.name.split(' ').map(w => w[0]).join('').substring(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="ai-suggestion-card">
          <h4><BarChart3 size={14} style={{ color: 'var(--primary)' }} /> Today&apos;s Insights</h4>
          {loading ? (
            <div style={{ padding: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generating insights...</div>
          ) : followups.map((f, i) => {
            const Icon = getIcon(f.icon);
            return (
              <div key={i} className="ai-suggestion-item">
                <Icon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>{f.text}</span>
              </div>
            );
          })}
        </div>

        <div className="ai-suggestion-card">
          <h4><Zap size={14} style={{ color: 'var(--warning)' }} /> Quick Actions</h4>
          <div className="ai-quick-actions">
            <button className="ai-quick-btn" onClick={() => window.location.href = '/dashboard/leads'}>
              <Plus size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> New Lead
            </button>
            <button className="ai-quick-btn" onClick={() => window.location.href = '/dashboard/calendar'}>
              <CalendarDays size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Schedule Visit
            </button>
            <button className="ai-quick-btn" onClick={() => window.location.href = '/dashboard/pipeline'}>
              <Columns3 size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> View Pipeline
            </button>
            <button className="ai-quick-btn" onClick={() => window.location.href = '/dashboard/whatsapp'}>
              <MessageCircle size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Send Message
            </button>
          </div>
        </div>
      </div>

      <div className="ai-panel-footer">
        <div className="ai-input-wrap">
          <input placeholder="Ask me anything..." />
          <button className="ai-send-btn">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="page-body">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton skeleton-title" style={{ width: '30%', height: 24 }} />
        <div className="skeleton skeleton-text" style={{ width: '50%' }} />
        <div className="stats-grid" style={{ marginTop: 8 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton skeleton-stat" />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
          <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    </div>
  );
}

function DashboardShell({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="app-layout">
        <aside className="sidebar" style={{ background: 'var(--bg-sidebar)' }}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">P</div>
            <h1>PropCRM</h1>
          </div>
        </aside>
        <main className="main-content">
          <SkeletonLoader />
        </main>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar
        user={session.user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} 
        onClick={() => setMobileOpen(false)} 
      />

      <main className="main-content" style={aiOpen ? { marginRight: 'var(--assistant-w)' } : {}}>
        <Topbar
          user={session.user}
          onToggleAI={() => setAiOpen(!aiOpen)}
          aiOpen={aiOpen}
          onToggleSidebar={() => setMobileOpen(!mobileOpen)}
        />
        {children}
      </main>
      <AIAssistantPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Providers>
      <DashboardShell>{children}</DashboardShell>
    </Providers>
  );
}
