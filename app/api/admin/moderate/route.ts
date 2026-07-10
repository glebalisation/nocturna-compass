import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED = ['approved', 'featured', 'rejected', 'duplicate', 'archived', 'needs_review'];

export async function POST(req: Request) {
  const jar = await cookies();
  if (!process.env.ADMIN_PASSWORD || jar.get('nocturna_admin')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status, patch } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const update: Record<string, unknown> = {};
  if (status) {
    if (!ALLOWED.includes(status)) return NextResponse.json({ error: 'Bad status' }, { status: 400 });
    update.status = status;
    update.featured = status === 'featured';
  }
  if (patch && typeof patch === 'object') {
    // whitelist editable fields
    for (const k of ['title', 'date', 'start_time', 'venue_name', 'neighborhood', 'price', 'description', 'ticket_url', 'image_url', 'genres', 'lineup']) {
      if (k in patch) update[k] = patch[k];
    }
  }

  const { error } = await sb.from('events').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
