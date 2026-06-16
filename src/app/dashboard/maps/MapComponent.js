'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { MapPin, Building2, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function MapComponent() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default to a central location (Mumbai) if no properties have coordinates
  const defaultCenter = [19.0760, 72.8777];

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(data => {
        // Only use properties that have valid lat/lng, otherwise mock for demo
        const props = (data.properties || []).map((p, i) => {
          if (p.latitude && p.longitude) return p;
          // Add slight offset for mock rendering if no coords
          return {
            ...p,
            latitude: 19.0760 + (Math.random() - 0.5) * 0.1,
            longitude: 72.8777 + (Math.random() - 0.5) * 0.1,
          };
        });
        setProperties(props);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius)' }}></div>;
  }

  return (
    <MapContainer center={defaultCenter} zoom={11} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius)' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {properties.map(p => (
        <Marker key={p.id} position={[p.latitude, p.longitude]}>
          <Popup>
            <div style={{ padding: '4px 0', minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Building2 size={14} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{p.title}</strong>
              </div>
              
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {p.location}{p.city ? `, ${p.city}` : ''}
              </div>
              
              <div style={{ fontWeight: 800, color: 'var(--success)', marginBottom: 12, fontSize: '1.1rem' }}>
                {formatCurrency(p.price, true)}
              </div>
              
              <Link href={`/dashboard/properties/${p.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                View Property
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
