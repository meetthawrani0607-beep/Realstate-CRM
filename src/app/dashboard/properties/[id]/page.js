'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Share2, Check } from 'lucide-react';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    fetch(`/api/properties/${id}`).then(r => r.json()).then(d => { setProperty(d.property); setLoading(false); });
  }, [id]);

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    const newImages = [];
    for (const file of files) {
      const b64 = await new Promise(r => { const rd = new FileReader(); rd.onload = ev => r(ev.target.result); rd.readAsDataURL(file); });
      newImages.push(b64);
    }
    const current = property.images ? (typeof property.images === 'string' ? JSON.parse(property.images) : property.images) : [];
    const updated = [...current, ...newImages];
    await fetch(`/api/properties/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: JSON.stringify(updated) }),
    });
    setProperty(prev => ({ ...prev, images: updated }));
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!property) return <div className="page-body"><p>Property not found</p></div>;

  const images = property.images ? (typeof property.images === 'string' ? JSON.parse(property.images) : property.images) : [];

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/dashboard/properties" className="btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h2>{property.title}</h2>
          {property.status && <span className={`badge ${property.status === 'available' ? 'badge-green' : 'badge-blue'}`}>{property.status}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={async () => {
              try { await navigator.clipboard.writeText(`${window.location.origin}/showcase/${property.id}`); } catch(err) {}
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              color: copied ? 'var(--success)' : 'var(--primary)', 
              background: copied ? 'var(--success-bg)' : 'var(--primary-bg)',
              border: copied ? '1px solid var(--success)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span style={{ fontWeight: 600 }}>{copied ? 'Link Copied!' : 'Share Showcase'}</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>📷 Upload Photos</button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="page-body">
        <div className="detail-grid animate-fade-in">
          <div>
            {/* Gallery */}
            {images.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 22 }}>
                <div style={{ position: 'relative', height: 380, background: 'var(--bg-input)' }}>
                  <img src={images[activeImg]} alt={property.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }} />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                        style={{
                          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                          color: 'var(--text-primary)', border: '1.5px solid var(--border)',
                          borderRadius: '50%', width: 38, height: 38, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button onClick={() => setActiveImg(i => (i + 1) % images.length)}
                        style={{
                          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                          color: 'var(--text-primary)', border: '1.5px solid var(--border)',
                          borderRadius: '50%', width: 38, height: 38, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', color: 'var(--text-primary)', padding: '5px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        {activeImg + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, padding: 12, overflowX: 'auto' }}>
                    {images.map((src, i) => (
                      <div key={i} onClick={() => setActiveImg(i)}
                        style={{
                          width: 64, height: 48, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                          border: i === activeImg ? '2px solid var(--accent)' : '2px solid transparent',
                          opacity: i === activeImg ? 1 : 0.6,
                          transition: 'all 0.2s', flexShrink: 0,
                        }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Property Details */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 18 }}>Property Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div className="detail-field">
                  <label>Location</label>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {property.location}{property.city ? `, ${property.city}` : ''}
                  </p>
                </div>
                <div className="detail-field"><label>Type</label><p style={{ textTransform: 'capitalize' }}>{property.type}</p></div>
                <div className="detail-field"><label>Price</label><p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>{formatCurrency(property.price, true)}</p></div>
                {property.bedrooms && <div className="detail-field"><label>Bedrooms</label><p>🛏️ {property.bedrooms} BHK</p></div>}
                {property.bathrooms && <div className="detail-field"><label>Bathrooms</label><p>🚿 {property.bathrooms}</p></div>}
                {property.area && <div className="detail-field"><label>Area</label><p>📐 {property.area} {property.areaUnit}</p></div>}
              </div>
              {property.description && (
                <div className="detail-field" style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <label>Description</label>
                  <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{property.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-sidebar">
            <div className="card" style={{ background: 'linear-gradient(135deg, #FFF5F0, #FFF0EA)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 10 }}>Price</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(property.price, true)}</div>
              {property.area && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>{formatCurrency(Math.round(property.price / property.area))} per {property.areaUnit}</p>}
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 10 }}>Photos</h3>
              <p style={{ fontSize: '0.9rem' }}>{images.length} photo{images.length !== 1 ? 's' : ''}</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => fileRef.current?.click()}>📷 Add More</button>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>Added</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(property.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
