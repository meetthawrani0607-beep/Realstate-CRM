'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, parseJsonField } from '@/lib/utils';
import { Search, Plus, X, MapPin, Bed, Bath, Ruler, Building2, Filter, LayoutGrid, List, Share2, Check } from 'lucide-react';

const TYPE_LABELS = { apartment: 'Apartment', villa: 'Villa', plot: 'Plot', commercial: 'Commercial', other: 'Other' };
const AVAILABILITY_STYLES = {
  available: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Available' },
  sold: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'Sold' },
  reserved: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Reserved' },
  upcoming: { bg: 'var(--blue-bg)', color: 'var(--blue)', label: 'Upcoming' },
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => { fetchProperties(); }, []);

  async function fetchProperties() {
    const res = await fetch('/api/properties');
    const data = await res.json();
    setProperties(data.properties || []);
    setLoading(false);
  }

  const filtered = properties.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.location?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && p.type !== typeFilter) return false;
    if (availFilter && p.availability !== availFilter) return false;
    return true;
  });

  async function handleCreate(formData) {
    const res = await fetch('/api/properties', { method: 'POST', body: formData });
    if (res.ok) { fetchProperties(); setShowModal(false); }
  }

  if (loading) {
    return (
      <div className="page-body">
        <div className="skeleton" style={{ width: '25%', height: 28, borderRadius: 'var(--radius)', marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="skeleton" style={{ width: '100%', height: 200 }} />
              <div style={{ padding: 16 }}>
                <div className="skeleton" style={{ width: '70%', height: 18, marginBottom: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Properties</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{filtered.length} listings in inventory</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '8px 12px', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} style={{ padding: '8px 12px', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
              <List size={16} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> Add Property</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={availFilter} onChange={e => setAvailFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="reserved">Reserved</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map(prop => <PropertyCard key={prop.id} property={prop} />)}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="table-wrap" style={{ boxShadow: 'var(--shadow-card)' }}>
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Price</th>
                <th>Area</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(prop => {
                const avail = AVAILABILITY_STYLES[prop.availability] || AVAILABILITY_STYLES.available;
                return (
                  <tr key={prop.id}>
                    <td>
                      <Link href={`/dashboard/properties/${prop.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {prop.title}
                      </Link>
                    </td>
                    <td><span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{prop.type}</span></td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(prop.price, true)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{prop.area ? `${prop.area} ${prop.areaUnit}` : '—'}</td>
                    <td><span className="badge" style={{ background: avail.bg, color: avail.color }}>{avail.label}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}><MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />{prop.location}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ padding: 80, textAlign: 'center' }}>
          <Building2 size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No properties found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>Adjust your filters or add a new listing.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={14} /> Add Property</button>
        </div>
      )}

      {/* Add Property Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={18} style={{ color: 'var(--primary)' }} /> Add Property</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <PropertyForm onSave={handleCreate} onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property: p }) {
  const images = parseJsonField(p.images, []);
  const avail = AVAILABILITY_STYLES[p.availability] || AVAILABILITY_STYLES.available;
  const [currentImg, setCurrentImg] = useState(0);
  const [copied, setCopied] = useState(false);

  return (
    <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-card)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease' }}
         onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'; }}
         onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}>
      {/* Image Carousel */}
      <div style={{ position: 'relative', height: 220, background: 'linear-gradient(135deg, var(--bg-elevated), var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {images.length > 0 ? (
          <>
            <img src={images[currentImg]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }} />
            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
                {images.map((_, i) => (
                  <div key={i} onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentImg(i); }} style={{ width: 6, height: 6, borderRadius: '50%', background: i === currentImg ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s' }} />
                ))}
              </div>
            )}
          </>
        ) : (
          <Building2 size={48} style={{ color: 'var(--text-muted)', opacity: 0.2 }} />
        )}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <span className="badge" style={{ background: avail.bg, color: avail.color, border: `1px solid ${avail.color}30`, backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{avail.label}</span>
        </div>
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.85)', color: 'var(--text-primary)', fontWeight: 700, backdropFilter: 'blur(8px)', textTransform: 'capitalize', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{p.type}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href={`/dashboard/properties/${p.id}`} style={{ textDecoration: 'none', flex: 1, paddingRight: 12 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>{p.title}</h3>
          </Link>
          <button 
            className="btn btn-secondary btn-sm" 
            title="Copy Public Showcase Link" 
            onClick={async (e) => {
              e.preventDefault();
              try { await navigator.clipboard.writeText(`${window.location.origin}/showcase/${p.id}`); } catch(err) {}
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              color: copied ? 'var(--success)' : 'var(--primary)', 
              background: copied ? 'var(--success-bg)' : 'var(--primary-bg)',
              border: copied ? '1px solid var(--success)' : '1px solid transparent',
              transition: 'all 0.2s ease',
              padding: '6px 12px'
            }}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <MapPin size={14} style={{ color: 'var(--primary)' }} /> {p.location}{p.city ? `, ${p.city}` : ''}
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(p.price, true)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {p.bedrooms != null && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Bed size={16} style={{ color: 'var(--text-primary)' }} /> <span>{p.bedrooms} Beds</span>
            </div>
          )}
          {p.bathrooms != null && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Bath size={16} style={{ color: 'var(--text-primary)' }} /> <span>{p.bathrooms} Baths</span>
            </div>
          )}
          {p.area != null && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Ruler size={16} style={{ color: 'var(--text-primary)' }} /> <span>{p.area} {p.areaUnit}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    title: '', location: '', city: '', state: '', price: '', type: 'apartment', bedrooms: '', bathrooms: '', area: '', areaUnit: 'sqft', availability: 'available', description: '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    onSave(fd);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group"><label>Title *</label><input required value={form.title} onChange={set('title')} placeholder="e.g. Luxury 3BHK in Andheri" /></div>
        <div className="form-row">
          <div className="form-group"><label>Location *</label><input required value={form.location} onChange={set('location')} placeholder="Andheri West" /></div>
          <div className="form-group"><label>City</label><input value={form.city} onChange={set('city')} placeholder="Mumbai" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Price (₹) *</label><input required type="number" value={form.price} onChange={set('price')} placeholder="5000000" /></div>
          <div className="form-group"><label>Type</label>
            <select value={form.type} onChange={set('type')}>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="plot">Plot</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Bedrooms</label><input type="number" value={form.bedrooms} onChange={set('bedrooms')} placeholder="3" /></div>
          <div className="form-group"><label>Bathrooms</label><input type="number" value={form.bathrooms} onChange={set('bathrooms')} placeholder="2" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Area</label><input type="number" value={form.area} onChange={set('area')} placeholder="1200" /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.availability} onChange={set('availability')}>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="upcoming">Upcoming</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={set('description')} placeholder="Property details..." /></div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary"><Plus size={14} /> Add Property</button>
      </div>
    </form>
  );
}
