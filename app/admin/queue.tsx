'use client';
import { useState } from 'react';
import type { NocturnaEvent } from '@/lib/types';

export default function ModerationQueue({ initial }: { initial: NocturnaEvent[] }) {
  const [events, setEvents] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function moderate(id: string, status: string) {
    setBusy(id);
    const res = await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) setEvents(ev => ev.filter(e => e.id !== id));
    setBusy(null);
  }

  if (!events.length) return <div className="empty">Queue is clear. Nothing to review.</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Event</th><th>Date</th><th>Venue</th><th>Source</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id} style={{ opacity: busy === e.id ? 0.4 : 1 }}>
              <td>
                <b style={{ textTransform: 'uppercase' }}>{e.title}</b>
                {e.lineup?.length > 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{e.lineup.join(' · ')}</div>
                )}
                {(e.tags ?? []).length > 0 && (
                  <div style={{ color: 'var(--green)', fontSize: 10.5, fontFamily: 'var(--mono)' }}>{(e.tags ?? []).join(' · ')}</div>
                )}
                {e.contact_email && (
                  <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)' }}>{e.contact_email}</div>
                )}
              </td>
              <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{e.date}<br />{e.start_time ?? ''}</td>
              <td>{e.venue_name ?? '—'}<br /><small style={{ color: 'var(--muted)' }}>{e.neighborhood ?? ''}</small></td>
              <td>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{e.source}</span>
                {(e.source_links ?? []).slice(0, 4).map((l, i) => (
                  <span key={i}><br /><a href={l.url} target="_blank" rel="noopener" style={{ color: 'var(--green)', fontSize: 11 }}>{l.source} ↗</a></span>
                ))}
                {!e.source_links?.length && e.source_url && (
                  <><br /><a href={e.source_url} target="_blank" rel="noopener" style={{ color: 'var(--green)', fontSize: 11 }}>source ↗</a></>
                )}
              </td>
              <td><span className={`status-badge ${e.status}`}>{e.status}</span></td>
              <td>
                <div className="admin-actions">
                  <button onClick={() => moderate(e.id, 'approved')}>Approve</button>
                  <button onClick={() => moderate(e.id, 'featured')}>Feature</button>
                  <button onClick={() => moderate(e.id, 'duplicate')}>Dup</button>
                  <button onClick={() => moderate(e.id, 'rejected')}>Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
