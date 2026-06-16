'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Building2, ArrowRight, Briefcase, Users } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState(''); // 'broker' | 'agency'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    orgName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: form.name,
          email: form.email,
          password: form.password,
          orgName: accountType === 'agency' ? form.orgName : undefined,
          accountType,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create account. Please try again.');
        setLoading(false);
      } else {
        router.push('/login');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in" style={{ maxWidth: accountType ? 440 : 520 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="sidebar-brand-icon">P</div>
          <h1>PropCRM</h1>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            {!accountType ? 'Choose your account type' : 'Create your account'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {!accountType ? 'Select how you\'ll be using PropCRM' : (
              accountType === 'broker' ? 'Set up your personal broker workspace' : 'Set up your agency workspace'
            )}
          </p>
        </div>

        {/* Account Type Selector */}
        {!accountType ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={() => setAccountType('broker')}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '20px 20px',
                background: 'var(--bg-elevated)', border: '2px solid var(--border)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                color: '#fff', flexShrink: 0,
              }}>
                <Briefcase size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                  Individual Broker
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  I work independently and manage my own leads, properties, and clients.
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 'auto' }} />
            </button>

            <button
              type="button"
              onClick={() => setAccountType('agency')}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '20px 20px',
                background: 'var(--bg-elevated)', border: '2px solid var(--border)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'var(--purple-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--purple, #8b5cf6), var(--purple-light, #a78bfa))',
                color: '#fff', flexShrink: 0,
              }}>
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                  Agency / Company
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  I manage a team of agents. I need roles, team views, and admin controls.
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 'auto' }} />
            </button>

            {/* Already have account */}
            <div className="auth-links" style={{ justifyContent: 'center', marginTop: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already have an account? </span>
              <Link href="/login" style={{ marginLeft: 6 }}>Sign in</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Back to account type selector */}
            <button
              type="button"
              onClick={() => setAccountType('')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: '0.82rem', color: 'var(--primary)', background: 'none',
                border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0,
                fontWeight: 600,
              }}
            >
              ← Change account type
            </button>

            {/* Account type badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: accountType === 'broker' ? 'var(--primary-bg)' : 'var(--purple-bg)',
              border: `1px solid ${accountType === 'broker' ? 'var(--primary)' : 'var(--purple, #8b5cf6)'}22`,
              borderRadius: 'var(--radius)', marginBottom: 20,
            }}>
              {accountType === 'broker' ? <Briefcase size={16} style={{ color: 'var(--primary)' }} /> : <Users size={16} style={{ color: 'var(--purple, #8b5cf6)' }} />}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: accountType === 'broker' ? 'var(--primary)' : 'var(--purple, #8b5cf6)' }}>
                {accountType === 'broker' ? 'Individual Broker Account' : 'Agency / Company Account'}
              </span>
            </div>

            {error && (
              <div className="auth-error">{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} />
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="John Doe"
                />
              </div>

              {accountType === 'agency' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} />
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={form.orgName}
                    onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))}
                    required
                    placeholder="Your Real Estate Agency"
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} />
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={14} />
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '0.95rem', marginTop: 8, borderRadius: 'var(--radius-lg)' }}
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: '2px' }} /> Creating account...</>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create {accountType === 'broker' ? 'Broker' : 'Agency'} Account
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Auth links */}
            <div className="auth-links" style={{ justifyContent: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already have an account? </span>
              <Link href="/login" style={{ marginLeft: 6 }}>Sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
