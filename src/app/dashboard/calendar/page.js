'use client';
import { useState, useEffect } from 'react';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, Plus, X, Clock, Home, ClipboardList, AlertCircle, Check } from 'lucide-react';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarPage() {
  const [visits, setVisits] = useState([]);
  const [leads, setLeads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    Promise.all([
      fetch('/api/visits').then(r => r.json()),
      fetch('/api/leads?limit=200').then(r => r.json()),
      fetch('/api/properties').then(r => r.json()),
    ]).then(([v, l, p]) => {
      setVisits(v.visits || []);
      setLeads(l.leads || []);
      setProperties(p.properties || []);
    });
  }, []);

  const events = visits.map(v => {
    const dateObj = new Date(v.date);
    const [hour, minute] = (v.time || '10:00').split(':');
    const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), parseInt(hour), parseInt(minute));
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    
    return {
      id: v.id,
      title: `${v.time} - ${v.lead?.name || 'Visit'}`,
      start,
      end,
      resource: v,
    };
  });

  function handleSelectSlot({ start }) {
    setSelectedDate(start);
    setShowForm(true);
  }

  async function handleSaveVisit(data) {
    const res = await fetch('/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) {
      const updated = await fetch('/api/visits').then(r => r.json());
      setVisits(updated.visits || []);
    }
    setShowForm(false);
  }

  return (
    <div className="animate-fade-in">
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-calendar { font-family: var(--font); color: var(--text-primary); }
        .rbc-btn-group button { color: var(--text-secondary); border-color: var(--border); }
        .rbc-btn-group button.rbc-active { background: var(--primary-bg); color: var(--primary-dark); box-shadow: none; border-color: var(--primary); }
        .rbc-btn-group button:hover { background: var(--bg-hover); }
        .rbc-toolbar-label { font-weight: 700; font-size: 1.25rem; }
        .rbc-header { padding: 12px 0; font-weight: 600; color: var(--text-secondary); border-bottom: 1px solid var(--border); text-transform: uppercase; font-size: 0.8rem; }
        .rbc-month-view { border-color: var(--border); border-radius: var(--radius); overflow: hidden; background: var(--bg-card); box-shadow: var(--shadow-card); }
        .rbc-day-bg { border-color: var(--border); }
        .rbc-day-bg.rbc-today { background: rgba(74, 144, 164, 0.05); }
        .rbc-date-cell { padding: 8px; font-weight: 500; }
        .rbc-event { background: var(--primary); border: none; border-radius: 6px; font-size: 0.8rem; padding: 4px 8px; box-shadow: var(--shadow-sm); }
        .rbc-event.completed { background: var(--success); }
        .rbc-event.cancelled { background: var(--danger); text-decoration: line-through; opacity: 0.7; }
        .rbc-month-row { border-top: 1px solid var(--border); }
      `}} />

      <div className="page-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Site Visit Calendar</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', mt: 1 }}>Schedule and monitor properties walk-throughs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedDate(new Date()); setShowForm(true); }}>
          <Plus size={16} /> Schedule Visit
        </button>
      </div>

      <div className="page-body">
        <div style={{ height: 600, marginBottom: 40 }}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            eventPropGetter={(event) => {
              const status = event.resource.status;
              let className = '';
              if (status === 'completed') className = 'completed';
              if (status === 'cancelled') className = 'cancelled';
              return { className };
            }}
            views={['month', 'week', 'day']}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
          />
        </div>

        {/* Upcoming Visits Table */}
        <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Upcoming Visits Schedule</h3>
          </div>
          
          {visits.filter(v => v.status === 'scheduled').length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>No upcoming visits scheduled</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Lead</th>
                    <th>Property</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.filter(v => v.status !== 'cancelled').slice(0, 10).map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 500 }}>{v.date ? format(new Date(v.date), 'MMM d, yyyy') : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <Clock size={14} /> {v.time}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{v.lead?.name || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <Home size={14} /> {v.property?.title || '—'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${v.status}`}>{v.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {v.status !== 'completed' && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--success)' }} onClick={async () => {
                            await fetch(`/api/visits/${v.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) });
                            const d = await fetch('/api/visits').then(r => r.json());
                            setVisits(d.visits || []);
                          }}>
                            <Check size={14} /> Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Schedule Visit</h3>
              </div>
              <button className="btn-icon" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <VisitForm date={selectedDate} leads={leads} properties={properties} onSave={handleSaveVisit} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function VisitForm({ date, leads, properties, onSave, onClose }) {
  const [form, setForm] = useState({ leadId: '', propertyId: '', date: date ? format(date, 'yyyy-MM-dd') : '', time: '10:00', notes: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <div className="modal-body">
        <div className="form-group">
          <label>Lead *</label>
          <select required value={form.leadId} onChange={set('leadId')} className="input">
            <option value="">Select lead...</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.phone}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Property *</label>
          <select required value={form.propertyId} onChange={set('propertyId')} className="input">
            <option value="">Select property...</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.title} — {p.location}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Date *</label>
            <input type="date" required value={form.date} onChange={set('date')} className="input" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Time *</label>
            <input type="time" required value={form.time} onChange={set('time')} className="input" />
          </div>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={form.notes} onChange={set('notes')} placeholder="Details about this site visit..." className="input" rows={3} />
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">Schedule Visit</button>
      </div>
    </form>
  );
}
