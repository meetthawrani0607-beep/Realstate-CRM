'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Columns3,
  Building2,
  MapPin,
  Calendar,
  MessageCircle,
  Link2,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  BarChart3,
  UsersRound,
  Bot,
} from 'lucide-react';

const navItems = [
  {
    section: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/leads', label: 'Leads', icon: Users },
      { href: '/dashboard/pipeline', label: 'Pipeline', icon: Columns3 },
      { href: '/dashboard/properties', label: 'Properties', icon: Building2 },
      { href: '/dashboard/maps', label: 'Maps', icon: MapPin },
    ],
  },
  {
    section: 'ENGAGEMENT',
    items: [
      { href: '/dashboard/calendar', label: 'Site Visits', icon: Calendar },
      { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageCircle },
      { href: '/dashboard/automations', label: 'Automations', icon: Zap },
      { href: '/dashboard/ai', label: 'AI Assistant', icon: Bot },
    ],
  },
  {
    section: 'WORKSPACE',
    items: [
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/team', label: 'Team', icon: UsersRound },
      { href: '/dashboard/integrations', label: 'Integrations', icon: Link2 },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';
}

export default function Sidebar({ user, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const isBroker = user?.accountType === 'broker';

  // Filter nav items based on account type
  const filteredNavItems = navItems.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Hide Team page for broker accounts
      if (isBroker && item.href === '/dashboard/team') return false;
      return true;
    }),
  })).filter(group => group.items.length > 0);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ background: 'transparent', boxShadow: 'none', color: 'var(--text-primary)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', letterSpacing: 0, fontWeight: 800 }}>Natura CRM</h1>
      </div>

      <nav className="sidebar-nav">
        {filteredNavItems.map((group) => (
          <div key={group.section}>
            <div className="sidebar-section">{group.section}</div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="nav-item-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Account type badge */}
        {!collapsed && (
          <div style={{ padding: '0 16px 8px', marginBottom: 4 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '3px 8px', borderRadius: 'var(--radius)',
              background: isBroker ? 'var(--primary-bg)' : 'var(--purple-bg)',
              color: isBroker ? 'var(--primary)' : 'var(--purple)',
            }}>
              {isBroker ? '🧑‍💼 Solo Broker' : '🏢 Agency'}
            </span>
          </div>
        )}
        {/* User */}
        <div className="sidebar-user" onClick={() => signOut({ callbackUrl: '/login' })} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <p>{user?.name || 'User'}</p>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <LogOut size={11} /> Sign Out
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
