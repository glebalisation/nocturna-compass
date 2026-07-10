import type { NocturnaEvent } from './types';

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nocturnacompass.com';

function pick(events: NocturnaEvent[], pred: (e: NocturnaEvent) => boolean): NocturnaEvent | undefined {
  return events.find(pred);
}

export interface Curated {
  top5: NocturnaEvent[];
  underground?: NocturnaEvent;
  cheap?: NocturnaEvent;
  afterhours?: NocturnaEvent;
  house?: NocturnaEvent;
  techno?: NocturnaEvent;
}

/** Curate the Friday issue from this weekend's published events. */
export function curate(events: NocturnaEvent[]): Curated {
  const featuredFirst = [...events].sort((a, b) =>
    Number(b.featured ?? false) - Number(a.featured ?? false));
  const has = (e: NocturnaEvent, t: string) =>
    (e as any).tags?.includes(t) || e.genres.includes(t);
  return {
    top5: featuredFirst.slice(0, 5),
    underground: pick(featuredFirst, e => has(e, 'warehouse')),
    cheap: pick(featuredFirst, e => e.is_free === true || has(e, 'free')),
    afterhours: pick(featuredFirst, e => has(e, 'afterhours')),
    house: pick(featuredFirst, e => has(e, 'house')),
    techno: pick(featuredFirst, e => has(e, 'techno')),
  };
}

function row(e: NocturnaEvent, label?: string): string {
  const d = new Date(e.date + 'T12:00:00').toLocaleDateString('en-US',
    { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
  return `
  <tr><td style="padding:14px 0;border-bottom:1px solid #1E2822;">
    ${label ? `<div style="font:700 10px 'Courier New',monospace;letter-spacing:2px;color:#2E8C5D;text-transform:uppercase;margin-bottom:4px;">${label}</div>` : ''}
    <a href="${site()}/events/${e.slug}" style="font:800 17px Arial,sans-serif;color:#E7ECE8;text-decoration:none;text-transform:uppercase;">${e.title}</a>
    <div style="font:12px 'Courier New',monospace;color:#8A968E;margin-top:3px;">
      ${d}${e.start_time ? ' · ' + e.start_time : ''} · ${e.venue_name ?? 'TBA'}${e.neighborhood ? ' · ' + e.neighborhood : ''}${e.is_free ? ' · FREE' : (e.price ? ' · ' + e.price : '')}
    </div>
  </td></tr>`;
}

export function renderNewsletter(c: Curated, weekOf: string): { subject: string; html: string } {
  const subject = `LA weekend party picks · ${weekOf}`;
  const sections = [
    c.underground && row(c.underground, 'Best underground pick'),
    c.cheap && row(c.cheap, 'Best free / cheap'),
    c.afterhours && row(c.afterhours, 'Best afterhours'),
    c.house && row(c.house, 'Best house'),
    c.techno && row(c.techno, 'Best techno'),
  ].filter(Boolean).join('');

  const html = `<!doctype html><html><body style="margin:0;background:#070908;padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#0E1210;border:1px solid #1E2822;border-radius:8px;">
    <tr><td style="padding:28px 28px 8px;">
      <div style="font:700 11px 'Courier New',monospace;letter-spacing:3px;color:#8FE3B0;text-transform:uppercase;">Nocturna Compass</div>
      <h1 style="font:850 26px Arial,sans-serif;color:#E7ECE8;text-transform:uppercase;margin:10px 0 2px;">This weekend<br>in LA.</h1>
      <div style="font:12px 'Courier New',monospace;color:#8A968E;">Top picks · ${weekOf}</div>
    </td></tr>
    <tr><td style="padding:8px 28px;">
      <div style="font:700 10px 'Courier New',monospace;letter-spacing:2px;color:#2E8C5D;text-transform:uppercase;margin:14px 0 2px;">Top 5 this weekend</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${c.top5.map(e => row(e)).join('')}</table>
      ${sections ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">${sections}</table>` : ''}
    </td></tr>
    <tr><td style="padding:20px 28px 30px;">
      <a href="${site()}/weekend" style="display:inline-block;background:#8FE3B0;color:#070908;font:700 12px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:13px 22px;border-radius:2px;">Full weekend calendar →</a>
      <div style="font:10px 'Courier New',monospace;color:#8A968E;margin-top:22px;">
        You get this because you asked for LA party picks. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#8A968E;">Unsubscribe</a>
      </div>
    </td></tr>
  </table></body></html>`;
  return { subject, html };
}
