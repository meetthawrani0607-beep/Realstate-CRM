'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setError(data.error || 'Failed to reset password.');
        setStatus('error');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-scale-in" style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-bg, #fef2f2)', color: 'var(--danger, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.5rem' }}>
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Invalid Reset Link</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-card animate-scale-in" style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-bg, #f0fdf4)', color: 'var(--success, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={28} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Password Reset!</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            Your password has been successfully changed. You can now sign in with your new password.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '0.95rem', borderRadius: 'var(--radius-lg)' }}
          >
            Go to Login <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in">
        {/* Logo */}
        <div className="auth-logo">
          <div className="sidebar-brand-icon">P</div>
          <h1>Natura CRM</h1>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Set New Password
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} />
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
              minLength={6}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} />
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '0.95rem', marginTop: 8, borderRadius: 'var(--radius-lg)' }}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: '2px' }} /> Resetting...</>
            ) : (
              <>Reset Password <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="auth-links" style={{ marginTop: 20 }}>
          <Link href="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
