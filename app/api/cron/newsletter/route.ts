import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getEvents, laWeekend } from '@/lib/data';
import { curate, renderNewsletter } from '@/lib/newsletter';

/**
 * Friday 11:00 AM Los Angeles (cron in vercel.json, UTC).
 * Builds the curated issue from published weekend events and sends it
 * via Resend Broadcasts to the audience. Issue is archived in `newsletters`.
 */

export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { from, to } = laWeekend();
  const events = await getEvents({ from, to, limit: 60 });
  if (!events.length) return NextResponse.json({ ok: true, skipped: 'no events' });

  const { subject, html } = renderNewsletter(curate(events), from);

  let sent = 0;
  const key = process.env.RESEND_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;

  if (key && audience) {
    const create = await fetch('https://api.resend.com/broadcasts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audience_id: audience,
        from: process.env.NEWSLETTER_FROM ?? 'Nocturna Compass <guide@nocturnacompass.com>',
        subject, html,
      }),
    });
    const created = await create.json().catch(() => null);
    if (created?.id) {
      const send = await fetch(`https://api.resend.com/broadcasts/${created.id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
      });
      if (send.ok) sent = 1;
    }
  }

  if (sb) {
    const { count } = await sb.from('subscribers')
      .select('id', { count: 'exact', head: true }).eq('status', 'active');
    await sb.from('newsletters').insert({
      week_of: from, subject, html,
      recipients: count ?? 0,
      sent_at: sent ? new Date().toISOString() : null,
    });
  }

  return NextResponse.json({ ok: true, sent: !!sent, week_of: from, events: events.length });
}
