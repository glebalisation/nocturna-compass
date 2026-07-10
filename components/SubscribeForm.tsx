'use client';
import { useState } from 'react';
import { GENRES, NEIGHBORHOODS } from '@/lib/types';

const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' };

export default function SubscribeForm({ source = 'homepage' }: { source?: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [refCode, setRefCode] = useState('');
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState('busy');
    const ref = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('ref') ?? undefined
      : undefined;
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fd.get('email'),
        phone: fd.get('phone') || undefined,
        genres: fd.getAll('genres'),
        areas: fd.getAll('areas'),
        consent: fd.get('consent') === 'on',
        sms_consent: fd.get('sms_consent') === 'on',
        source, ref,
      }),
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      setRefCode(json.referral_code ?? '');
      setState('ok');
    } else setState('err');
  }

  /* ---------- growth loop after subscribe ---------- */
  if (state === 'ok') {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${refCode}`;
    return (
      <div style={{ maxWidth: 560, margin: '28px auto 0', textAlign: 'left' }}>
        <div className="notice">✓ You&apos;re in. First picks arrive Friday 11:00 AM PT.</div>
        <div style={{ border: '1px solid var(--green-deep)', borderRadius: 6, padding: '20px 22px', marginTop: 14, background: 'rgba(23,59,44,.18)' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Unlock private picks</div>
          <p style={{ fontSize: 14, color: 'var(--text)' }}>
            Invite <b>3 friends</b> and get access to private picks, guestlist drops
            and secret events.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <input readOnly value={link} aria-label="Your invite link"
              style={{ flex: 1, minWidth: 220, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--glow)', fontFamily: 'var(--mono)', fontSize: 12, padding: '11px 13px' }} />
            <button type="button" className="btn btn-primary btn-sm"
              onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); }}>
              {copied ? 'Copied ✓' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 560, margin: '30px auto 0', textAlign: 'left' }}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`em-${source}`}>Email *</label>
          <input id={`em-${source}`} type="email" name="email" placeholder="your@email.com" required />
        </div>
        <div className="field">
          <label htmlFor={`ph-${source}`}>Phone (optional, for SMS drops)</label>
          <input id={`ph-${source}`} type="tel" name="phone" placeholder="+1 …" />
        </div>
      </div>

      <div className="field">
        <label>Favorite genres</label>
        <div style={{ display: 'flex', gap: '8px 16px', flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: 12 }}>
          {GENRES.map(g => (
            <label key={g} style={chip}>
              <input type="checkbox" name="genres" value={g} /> {g}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Preferred areas</label>
        <div style={{ display: 'flex', gap: '8px 16px', flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: 12 }}>
          {NEIGHBORHOODS.map(n => (
            <label key={n.slug} style={chip}>
              <input type="checkbox" name="areas" value={n.name} /> {n.name}
            </label>
          ))}
        </div>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label style={{ ...chip, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
          <input type="checkbox" name="consent" required />
          I agree to receive the Friday newsletter from Nocturna Compass *
        </label>
        <label style={{ ...chip, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
          <input type="checkbox" name="sms_consent" />
          Also text me occasional guestlist / secret event drops (if phone given)
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={state === 'busy'} style={{ width: '100%', justifyContent: 'center' }}>
        {state === 'busy' ? 'Joining…' : 'Get LA weekend party picks every Friday'}
      </button>
      {state === 'err' && <div className="notice err">Something went wrong — try again.</div>}
    </form>
  );
}
