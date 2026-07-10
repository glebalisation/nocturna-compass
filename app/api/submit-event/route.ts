import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fingerprint, slugify } from '@/lib/dedupe';

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.title || !b?.date || !b?.venue_name || !b?.contact_email || !b?.genre) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, demo: true }); // demo mode: accept silently

  const clean = (s: unknown, max = 300) =>
    typeof s === 'string' ? s.trim().slice(0, max) : null;

  const row = {
    slug: slugify(b.title, b.date),
    title: clean(b.title, 120)!,
    description: clean(b.description, 1200),
    date: b.date,
    start_time: clean(b.start_time, 8),
    venue_name: clean(b.venue_name, 120),
    neighborhood: clean(b.neighborhood, 60),
    genres: [String(b.genre).toLowerCase().slice(0, 24)],
    lineup: clean(b.lineup, 300)?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? [],
    price: clean(b.price, 40),
    is_free: /^free/i.test(String(b.price ?? '')),
    ticket_url: clean(b.ticket_url, 400),
    instagram_url: clean(b.instagram_url, 400),
    contact_email: clean(b.contact_email, 200),
    status: 'needs_review' as const,
    source: 'submission',
    fingerprint: fingerprint(b.title, b.date, b.venue_name),
  };

  const { error } = await sb.from('events').insert(row);
  if (error) {
    // unique fingerprint violation ⇒ duplicate submission; treat as accepted
    if (error.code === '23505') return NextResponse.json({ ok: true, duplicate: true });
    console.error('submit-event:', error.message);
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
