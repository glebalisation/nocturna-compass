import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runSource } from '@/lib/collectors';
import { laToday, SourceRow } from '@/lib/collectors/types';
import { upsertCollected, MergeStats } from '@/lib/merge';

/**
 * Nightly collection — 2:00 AM Los Angeles (see vercel.json, cron in UTC).
 * Pipeline: sources table → per-kind collector → normalize → merge/dedupe →
 * moderation queue. Nothing is ever auto-published.
 */

export const maxDuration = 300; // 5 min (Vercel Pro); Hobby caps lower — split sources if needed

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, demo: true });

  const { data: sources } = await sb.from('sources').select('*').eq('active', true);
  const stats: MergeStats = { inserted: 0, merged: 0, skipped: 0 };
  const today = laToday();
  const perSource: Record<string, number> = {};

  for (const src of (sources ?? []) as SourceRow[]) {
    const found = await runSource(src);
    perSource[src.name] = found.length;
    for (const ev of found) {
      if (ev.date < today) continue;                       // past = noise
      await upsertCollected(sb, ev, src.kind, stats);
    }
    await sb.from('sources').update({
      last_run_at: new Date().toISOString(),
      last_found: found.length,
    }).eq('id', src.id);
  }

  // stale sweep: approved events whose date passed → archived
  await sb.from('events').update({ status: 'archived' })
    .lt('date', today).in('status', ['approved', 'featured']);

  return NextResponse.json({ ok: true, ...stats, perSource });
}
