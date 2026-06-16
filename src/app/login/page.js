'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock, ArrowRight, X } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [forgotModal, setForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in">
        {/* Logo */}
        <div className="auth-logo">
          <div className="sidebar-brand-icon">P</div>
          <h1>PropCRM</h1>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Sign in to manage your leads and properties
          </p>
        </div>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} />
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '0.95rem', marginTop: 8, borderRadius: 'var(--radius-lg)' }}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: '2px' }} /> Signing in...</>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Auth links */}
        <div className="auth-links">
          <a href="#" onClick={e => { e.preventDefault(); setForgotModal(true); setResetStatus('idle'); setResetEmail(''); }}>Forgot password?</a>
          <Link href="/register">Create account</Link>
        </div>

        {/* Quick login hints */}
        <div style={{
          marginTop: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Demo Accounts</p>
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
            onClick={() => { setEmail('admin@propcrm.io'); setPassword('password123'); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'var(--purple-bg)', color: 'var(--purple, #8b5cf6)' }}>🏢 Agency</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              admin@propcrm.io / password123
            </p>
          </div>
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
            onClick={() => { setEmail('broker@propcrm.io'); setPassword('password123'); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'var(--primary-bg)', color: 'var(--primary)' }}>🧑‍💼 Broker</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              broker@propcrm.io / password123
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="modal-overlay" onClick={() => setForgotModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="btn-icon" onClick={() => setForgotModal(false)}><X size={16} /></button>
            </div>
            
            {resetStatus === 'success' ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Mail size={24} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-primary)' }}>Check your email</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  We&apos;ve sent a password reset link to <strong>{resetEmail}</strong>.
                </p>
                <button className="btn btn-primary" onClick={() => setForgotModal(false)} style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setResetStatus('loading');
                try {
                  const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmail }),
                  });
                  const data = await res.json();
                  if (data.previewUrl) {
                    // In dev mode, open the Ethereal preview so user can see the email
                    window.open(data.previewUrl, '_blank');
                  }
                  setResetStatus('success');
                } catch {
                  setResetStatus('error');
                }
              }}>
                <div className="modal-body">
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                  {resetStatus === 'error' && (
                    <div className="auth-error" style={{ marginBottom: 12 }}>Something went wrong. Please try again.</div>
                  )}
                  <div className="form-group">
                    <label>Email address</label>
                    <input 
                      type="email" 
                      required 
                      value={resetEmail} 
                      onChange={e => setResetEmail(e.target.value)} 
                      placeholder="you@example.com" 
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setForgotModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={resetStatus === 'loading'}>
                    {resetStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
