'use client';
import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function PortalSimulator() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  
  const [formData, setFormData] = useState({
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.s@example.com',
    budget: '75L',
    source: '99acres',
    property_type: 'villa',
    city: 'Bangalore',
    locality: 'Whitefield',
    message: 'Looking for a 3BHK ready to move villa.'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      setResponse({ type: 'error', data: { error: 'Please provide the Secret API Key from your CRM Integrations.' } });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey.trim()
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        setResponse({ type: 'success', data });
      } else {
        setResponse({ type: 'error', data });
      }
    } catch (err) {
      setResponse({ type: 'error', data: { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  const randomizeData = () => {
    const firstNames = ['Amit', 'Priya', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavita', 'Sanjay'];
    const lastNames = ['Patel', 'Singh', 'Kumar', 'Sharma', 'Gupta', 'Verma', 'Reddy'];
    const properties = ['apartment', 'villa', 'plot', 'commercial'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'];
    const budgets = ['50L', '75L', '1Cr', '1.5Cr', '2Cr+', '30L'];
    
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    setFormData({
      ...formData,
      name: `${r(firstNames)} ${r(lastNames)}`,
      phone: `9${Math.floor(Math.random() * 899999999 + 100000000)}`,
      email: `${r(firstNames).toLowerCase()}${Math.floor(Math.random() * 999)}@gmail.com`,
      budget: r(budgets),
      property_type: r(properties),
      city: r(cities),
    });
    setResponse(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#F8FAFC', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 10, background: 'linear-gradient(to right, #38BDF8, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Portal Webhook Simulator
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>
            Simulate an external property portal (like 99acres) sending a live lead to your CRM.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
          
          {/* LEFT: Payload Builder */}
          <div style={{ background: '#1E293B', padding: 30, borderRadius: 16, border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>1. Build Lead Payload</h2>
              <button onClick={randomizeData} type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#334155', border: 'none', color: '#CBD5E1', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem' }}>
                <RefreshCw size={14} /> Randomize
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 5 }}>Name</label>
                <input name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', color: '#fff', borderRadius: 8, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 5 }}>Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', color: '#fff', borderRadius: 8, outline: 'none' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 5 }}>Email</label>
                <input name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', color: '#fff', borderRadius: 8, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 5 }}>Portal Source (slug)</label>
                <input name="source" value={formData.source} onChange={handleChange} style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: 8, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 5 }}>Budget</label>
                <input name="budget" value={formData.budget} onChange={handleChange} style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', color: '#fff', borderRadius: 8, outline: 'none' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 5 }}>Message/Notes</label>
                <textarea name="message" value={formData.message} onChange={handleChange} style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', color: '#fff', borderRadius: 8, outline: 'none', minHeight: 80, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* RIGHT: Request Trigger & Response */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ background: '#1E293B', padding: 30, borderRadius: 16, border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>2. Authenticate & Fire</h2>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 5 }}>Paste your CRM API Key (X-API-Key)</label>
                <input 
                  type="text" 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)} 
                  placeholder="pk_xxxxxxxxxxxxxxxxxxxxxx"
                  style={{ width: '100%', padding: '12px', background: '#0F172A', border: '1px solid #38BDF8', color: '#fff', borderRadius: 8, outline: 'none', fontFamily: 'monospace' }} 
                />
              </div>

              <button 
                onClick={handleSimulate}
                disabled={loading}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: 8, border: 'none', 
                  background: loading ? '#475569' : '#38BDF8', 
                  color: loading ? '#94A3B8' : '#0F172A', 
                  fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s'
                }}>
                {loading ? 'Transmitting...' : <><Send size={18} /> Fire Webhook to CRM</>}
              </button>
            </div>

            {/* RESPONSE VIEWER */}
            <div style={{ background: '#1E293B', padding: 30, borderRadius: 16, border: '1px solid #334155', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>3. Server Response</h2>
              
              {!response ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center' }}>
                  Awaiting request...
                </div>
              ) : (
                <div style={{ 
                  flex: 1, 
                  background: '#0F172A', 
                  borderRadius: 8, 
                  border: `1px solid ${response.type === 'success' ? '#22C55E' : '#EF4444'}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ padding: '10px 15px', background: response.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderBottom: `1px solid ${response.type === 'success' ? '#22C55E' : '#EF4444'}`, display: 'flex', alignItems: 'center', gap: 8, color: response.type === 'success' ? '#22C55E' : '#EF4444', fontWeight: 600, fontSize: '0.9rem' }}>
                    {response.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {response.type === 'success' ? '200 OK — Lead Imported Successfully!' : '400/401 — Request Failed'}
                  </div>
                  <pre style={{ padding: 15, margin: 0, overflowX: 'auto', fontSize: '0.8rem', color: '#CBD5E1', fontFamily: 'monospace' }}>
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
