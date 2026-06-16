'use client';
import dynamic from 'next/dynamic';
import { MapPin, Search } from 'lucide-react';
import { useState } from 'react';

// Dynamically import map component to avoid SSR window errors
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius)' }}></div>
});

export default function MapsPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="page-body animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-h) - 56px)' }}>
      <div style={{ marginBottom: 20, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Interactive Maps</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Visualize your properties and leads spatially.</p>
        </div>
        
        <div style={{ position: 'relative', width: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            placeholder="Search location..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38, width: '100%' }}
          />
        </div>
      </div>

      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', display: 'flex' }}>
        <MapComponent />
      </div>
    </div>
  );
}
