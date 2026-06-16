'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, CheckCircle2, AlertCircle, BookOpen, Key, Send, Check, Briefcase, Users } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({ token: '', phoneId: '', verifyToken: '', webhookUrl: '' });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetch('/api/settings/whatsapp').then(r => r.json()).then(d => {
      setConfig(d.config || {});
      setStatus(d.status);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings/whatsapp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
  }

  async function handleTest() {
    if (!testPhone) return;
    setTesting(true); setTestResult(null);
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, message: '✅ PropCRM WhatsApp integration test — if you received this, your setup is working!', leadId: 'test' }),
    });
    const data = await res.json();
    setTestResult(data.whatsapp?.delivered ? '✅ Message sent successfully!' : '❌ Failed — check your credentials');
    setTesting(false);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings size={24} className="text-primary" />
            System Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage api integrations, webhook subscriptions, and server keys.</p>
        </div>
      </div>

      <div className="page-body max-w-3xl">
        {/* Account Details */}
        <div className="card animate-fade-in bg-white border border-slate-200 shadow-sm rounded-xl p-5" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-slate-100 text-slate-600 border border-slate-200">
            {session?.user?.accountType === 'broker' ? <Briefcase size={24} /> : <Users size={24} />}
          </div>
          <div>
            <strong className="text-slate-900 text-base block font-semibold">
              {session?.user?.orgName || 'Your Organization'}
            </strong>
            <p className="text-xs text-slate-500 mt-0.5">
              {session?.user?.accountType === 'broker' ? 'Individual Broker Account' : 'Agency Account'}
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="card animate-fade-in bg-white border border-slate-200 shadow-sm rounded-xl p-5" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0 border ${
            status === 'connected' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}>
            {status === 'connected' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <strong className="text-slate-900 text-base block font-semibold">
              {status === 'connected' ? 'Meta WhatsApp Cloud API Active' : 'WhatsApp API Pending Configuration'}
            </strong>
            <p className="text-xs text-slate-500 mt-0.5">
              {status === 'connected'
                ? 'Webhook listener is live. Messages will deliver to real WhatsApp numbers.'
                : 'Configure your Meta WhatsApp Business API credentials below to enable live messaging.'}
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className={`badge ${status === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} px-2.5 py-1 rounded-full text-xs font-semibold`}>
              {status === 'connected' ? 'Operational' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="card animate-slide-up bg-white border border-slate-200 shadow-sm rounded-xl p-6" style={{ marginBottom: 20 }}>
          <div className="section-header border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-slate-900">📖 Meta API Configuration Guide</h3>
          </div>
          <ol style={{ paddingLeft: 20, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 2.2 }}>
            <li>Navigate to <a href="https://developers.facebook.com" target="_blank" className="text-primary hover:text-blue-600 underline font-semibold transition-colors">developers.facebook.com</a> and provision a Meta App</li>
            <li>Enable the <strong className="text-slate-800">WhatsApp</strong> product inside your developer dashboard</li>
            <li>Retrieve your secret <strong className="text-slate-800">Phone Number ID</strong> and <strong className="text-slate-800">Permanent Access Token</strong></li>
            <li>Configure your <strong className="text-slate-800">Webhook Web Listener URL</strong> in Facebook Developer console:
              <div style={{
                background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius)',
                fontFamily: 'monospace', margin: '8px 0', wordBreak: 'break-all',
                fontSize: '0.82rem', color: 'var(--text-primary)', border: '1px solid var(--border)'
              }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : 'https://your-domain.com/api/whatsapp/webhook'}
              </div>
            </li>
            <li>Configure subscription webhook trigger for the <code className="bg-slate-50 border border-slate-200 text-primary px-1.5 py-0.5 rounded text-xs">messages</code> field</li>
            <li>Copy and paste your credentials below to establish secure communications.</li>
          </ol>
        </div>

        {/* API Credentials */}
        <div className="card animate-slide-up bg-white border border-slate-200 shadow-sm rounded-xl p-6" style={{ marginBottom: 20 }}>
          <div className="section-header border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <Key size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-slate-900">🔑 Secure API Credentials</h3>
          </div>
          <div className="form-group mb-4">
            <label className="text-slate-700 font-medium text-xs mb-1.5 block">WhatsApp Cloud API System Token</label>
            <input
              type="password"
              value={config.token}
              onChange={e => setConfig(c => ({ ...c, token: e.target.value }))}
              placeholder="EAAxxxxxx..."
              className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="form-group mb-4">
            <label className="text-slate-700 font-medium text-xs mb-1.5 block">Phone Number ID</label>
            <input
              value={config.phoneId}
              onChange={e => setConfig(c => ({ ...c, phoneId: e.target.value }))}
              placeholder="e.g. 10488274199201"
              className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="form-group mb-6">
            <label className="text-slate-700 font-medium text-xs mb-1.5 block">Webhook Verify Token <span className="text-slate-500 font-normal">(any secret string you choose)</span></label>
            <input
              value={config.verifyToken}
              onChange={e => setConfig(c => ({ ...c, verifyToken: e.target.value }))}
              placeholder="my-secret-verify-token"
              className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 w-full focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
          <button className="btn btn-primary flex items-center justify-center gap-2 w-full md:w-auto" onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="spinner animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                Saving...
              </span>
            ) : (
              <>
                <Check size={14} />
                Save Credentials
              </>
            )}
          </button>
        </div>

        {/* Test Connection */}
        <div className="card animate-slide-up bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <div className="section-header border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <Send size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-slate-900">🧪 Operational Integration Test</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Verify webhook delivery and live connectivity by dispatching a test message.
          </p>
          <div className="flex gap-3">
            <input
              placeholder="Phone number with country code (e.g. 919876543210)"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
            <button className="btn btn-primary" onClick={handleTest} disabled={testing}>
              {testing ? 'Sending...' : 'Dispatch Test'}
            </button>
          </div>
          {testResult && (
            <div className={`mt-4 p-3 rounded-lg border text-sm font-medium ${
              testResult.includes('✅') 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
