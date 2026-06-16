import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Bed, Bath, Square, Calendar, Check, Star } from 'lucide-react';
import Image from 'next/image';

export async function generateMetadata({ params }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id }
  });
  if (!property) return { title: 'Property Not Found' };
  return {
    title: `${property.title} | Real Estate Showcase`,
    description: property.description,
  };
}

export default async function ShowcasePage({ params, searchParams }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { org: true }
  });

  if (!property) return notFound();

  // Basic images array fallback
  let images = [];
  try {
    if (typeof property.images === 'string') {
      images = JSON.parse(property.images);
    } else if (Array.isArray(property.images)) {
      images = property.images;
    }
  } catch(e) {}
  if (!images || images.length === 0) {
    images = [`https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80`];
  }

  const features = property.features ? (typeof property.features === 'string' ? property.features.split(',').map(s=>s.trim()) : property.features) : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-default)', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <header style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Star size={22} fill="currentColor" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{property.org?.name || 'Showcase'}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Exclusive Property Listing</p>
          </div>
        </div>
        <div>
          <a href={`mailto:${property.org?.email || ''}`} className="btn" style={{ textDecoration: 'none', background: '#fff', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontWeight: 600, padding: '10px 20px', borderRadius: 99 }}>
            Contact Agent
          </a>
        </div>
      </header>

      {/* Hero Image Gallery */}
      <div style={{ padding: '20px 5%', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: images.length >= 3 ? '2fr 1fr' : '1fr', gridTemplateRows: images.length >= 3 ? '250px 250px' : '500px', gap: 16, borderRadius: 24, overflow: 'hidden' }}>
          <div style={{ position: 'relative', gridRow: images.length >= 3 ? '1 / 3' : '1' }}>
            <img src={images[0]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
            <div style={{ position: 'absolute', bottom: 30, left: 30, color: '#fff' }}>
              <div style={{ display: 'inline-block', padding: '6px 16px', background: 'var(--primary)', borderRadius: 99, fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                {(property.availability || 'available').replace('_', ' ')}
              </div>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.5)', marginBottom: 8, lineHeight: 1.1 }}>{property.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', opacity: 0.9 }}>
                <MapPin size={20} /> {property.location}
              </div>
            </div>
          </div>
          {images.length >= 3 && (
            <>
              <div style={{ position: 'relative' }}><img src={images[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div style={{ position: 'relative' }}><img src={images[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 5%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 60, alignItems: 'start' }}>
        
        {/* Left Column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 40 }}>
            <div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em' }}>
                {formatCurrency(property.price)}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 24, color: 'var(--text-secondary)' }}>
              {property.bedrooms > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 16, border: '1px solid var(--border)' }}>
                  <Bed size={24} style={{ marginBottom: 6, color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{property.bedrooms}</span>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Beds</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 16, border: '1px solid var(--border)' }}>
                  <Bath size={24} style={{ marginBottom: 6, color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{property.bathrooms}</span>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Baths</span>
                </div>
              )}
              {property.area > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 16, border: '1px solid var(--border)' }}>
                  <Square size={24} style={{ marginBottom: 6, color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{property.area}</span>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Sq Ft</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>About this property</h3>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {property.description || 'No description provided.'}
            </p>
          </div>

          {features.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>Features & Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: 99, color: 'var(--text-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Check size={16} style={{ color: 'var(--success)' }} strokeWidth={3} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Contact Card */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.06)', position: 'sticky', top: 120 }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Interested in this property?</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
            Leave your details and the agent will get back to you shortly to schedule a viewing or answer questions.
          </p>

          <form action="/api/webhook/lead" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {searchParams?.success === 'true' && (
              <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={18} /> Thank you! Your request has been sent.
              </div>
            )}
            <input type="hidden" name="orgId" value={property.orgId} />
            <input type="hidden" name="source" value="Showcase Page" />
            <input type="hidden" name="propertyId" value={property.id} />
            
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name *</label>
              <input type="text" name="name" required className="input" placeholder="John Doe" style={{ background: 'var(--bg-input)', border: 'none', padding: '14px 16px', borderRadius: 12 }} />
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number *</label>
              <input type="tel" name="phone" required className="input" placeholder="+1 (555) 000-0000" style={{ background: 'var(--bg-input)', border: 'none', padding: '14px 16px', borderRadius: 12 }} />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
              <input type="email" name="email" className="input" placeholder="john@example.com" style={{ background: 'var(--bg-input)', border: 'none', padding: '14px 16px', borderRadius: 12 }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px 0', fontSize: '1rem', marginTop: 12, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary), var(--accent))', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              Request Details
            </button>
            <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', marginTop: 12 }}>
              By submitting this form, you agree to be contacted by {property.org?.name || 'the agent'}.
            </p>
          </form>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-card)', padding: '40px 5%', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>&copy; {new Date().getFullYear()} {property.org?.name || 'Real Estate CRM'}. All rights reserved.</p>
        <p style={{ marginTop: 8 }}>Listed via Earthy & Natural Real Estate Platform</p>
      </footer>
    </div>
  );
}
