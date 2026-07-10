'use client';
import { useState } from 'react';
import { GENRES, NEIGHBORHOODS } from '@/lib/types';

export default function SubmitPage() {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('busy');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch('/api/submit-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setState(res.ok ? 'ok' : 'err');
  }

  if (state === 'ok') {
    return (
      <main>
        <section className="container" style={{ maxWidth: 720 }}>
          <div className="eyebrow">Submission received</div>
          <h1>Thank <em>you</em>.</h1>
          <p className="lede">
            Your event is in the moderation queue. Our editors verify every submission
            before it goes live — usually within 24 hours. We&apos;ll email you when it&apos;s published.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="container" style={{ maxWidth: 720 }}>
        <div className="eyebrow">For promoters &amp; venues</div>
        <h1>Submit an <em>event</em></h1>
        <p className="lede">
          Free listing on Nocturna Compass. Every submission is reviewed by our editors
          before publishing — usually within 24 hours.
        </p>

        <form onSubmit={submit} style={{ marginTop: 44 }}>
          <div className="field">
            <label htmlFor="title">Event name *</label>
            <input id="title" name="title" required maxLength={120} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="date">Date *</label>
              <input id="date" name="date" type="date" required />
            </div>
            <div className="field">
              <label htmlFor="start_time">Start time</label>
              <input id="start_time" name="start_time" type="time" />
            </div>
            <div className="field">
              <label htmlFor="venue_name">Venue *</label>
              <input id="venue_name" name="venue_name" required maxLength={120} placeholder="or “Secret location”" />
            </div>
            <div className="field">
              <label htmlFor="neighborhood">Neighborhood</label>
              <select id="neighborhood" name="neighborhood" defaultValue="">
                <option value="">— select —</option>
                {NEIGHBORHOODS.map(n => <option key={n.slug} value={n.name}>{n.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="genre">Main genre *</label>
              <select id="genre" name="genre" required defaultValue="">
                <option value="" disabled>— select —</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="price">Price</label>
              <input id="price" name="price" placeholder="$20 / Free / Free RSVP" maxLength={40} />
            </div>
            <div className="field">
              <label htmlFor="ticket_url">Ticket link</label>
              <input id="ticket_url" name="ticket_url" type="url" placeholder="https://…" />
            </div>
            <div className="field">
              <label htmlFor="instagram_url">Instagram link</label>
              <input id="instagram_url" name="instagram_url" type="url" placeholder="https://instagram.com/…" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="lineup">Lineup (comma separated)</label>
            <input id="lineup" name="lineup" placeholder="DJ One, DJ Two b2b DJ Three" maxLength={300} />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={4} maxLength={1200} />
          </div>
          <div className="field">
            <label htmlFor="contact_email">Your contact email *</label>
            <input id="contact_email" name="contact_email" type="email" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={state === 'busy'}>
            {state === 'busy' ? 'Sending…' : 'Send to moderation'}
          </button>
          {state === 'err' && <div className="notice err">Something went wrong — try again or email us.</div>}
        </form>
      </section>
    </main>
  );
}
