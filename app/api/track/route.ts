import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const { event_id, kind } = await req.json().catch(() => ({}));
  if (!event_id) return NextResponse.json({ ok: true });
  const sb = supabaseAdmin();
  if (sb) {
    await sb.from('clicks').insert({
      event_id,
      kind: ['ticket', 'view', 'share'].includes(kind) ? kind : 'ticket',
    });
  }
  return NextResponse.json({ ok: true });
}
