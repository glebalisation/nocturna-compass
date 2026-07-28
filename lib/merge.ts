import type { SupabaseClient } from '@supabase/supabase-js';
import { Collected, autoTags } from './collectors/types';
import { fingerprint, slugify, norm } from './dedupe';

/** Token-overlap similarity for titles ("Concrete Ritual w/ Vera Holt" ≈ "Concrete Ritual"). */
function titleSim(a: string, b: string): number {
  const ta = new Set(norm(a).match(/.{1,4}/g) ?? []);
  const tb = new Set(norm(b).match(/.{1,4}/g) ?? []);
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit++;
  return hit / Math.min(ta.size, tb.size);
}

export interface MergeStats { inserted: number; merged: number; skipped: number; }

/**
 * Insert-or-merge one collected event.
 * Match (spec): same fingerprint OR same date + (same venue OR same ticket URL
 * OR very similar title). On match: fill missing fields, append source link,
 * bump last_seen_at. New events land as needs_review — never auto-published.
 */
export async function upsertCollected(
  sb: SupabaseClient, ev: Collected, sourceKind: string, stats: MergeStats,
) {
  if (!ev.title || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) { stats.skipped++; return; }

  const fp = fingerprint(ev.title, ev.date, ev.venue_name);
  const { data: sameDay } = await sb.from('events')
    .select('id,title,venue_name,ticket_url,source_links,genres,lineup,tags,image_url,start_time,end_time,price,age_restriction,address,promoter,description,lat,lng')
    .eq('date', ev.date).limit(200);

  const match = (sameDay ?? []).find(e =>
    fingerprint(e.title, ev.date, e.venue_name) === fp ||
    (ev.venue_name && e.venue_name && norm(e.venue_name) === norm(ev.venue_name) && titleSim(e.title, ev.title) >= 0.5) ||
    (ev.ticket_url && e.ticket_url && e.ticket_url === ev.ticket_url) ||
    titleSim(e.title, ev.title) >= 0.85
  );

  const newLink = ev.source_url ? [{ source: sourceKind, url: ev.source_url }] : [];

  if (match) {
    const links = Array.isArray(match.source_links) ? match.source_links : [];
    const hasLink = links.some((l: any) => l.url === ev.source_url);
    const { error } = await sb.from('events').update({
      // fill gaps only — never overwrite admin edits
      start_time: match.start_time ?? ev.start_time ?? null,
      end_time: match.end_time ?? ev.end_time ?? null,
      image_url: match.image_url ?? ev.image_url ?? null,
      price: match.price ?? ev.price ?? null,
      age_restriction: match.age_restriction ?? ev.age_restriction ?? null,
      address: match.address ?? ev.address ?? null,
      lat: match.lat ?? ev.lat ?? null,
      lng: match.lng ?? ev.lng ?? null,
      promoter: match.promoter ?? ev.promoter ?? null,
      description: match.description ?? ev.description ?? null,
      lineup: match.lineup?.length ? match.lineup : (ev.lineup ?? []),
      genres: match.genres?.length ? match.genres : (ev.genres ?? []),
      tags: [...new Set([...(match.tags ?? []), ...autoTags(ev)])],
      source_links: hasLink ? links : [...links, ...newLink],
      last_seen_at: new Date().toISOString(),
    }).eq('id', match.id);
    if (error) { stats.skipped++; console.error('merge:', error.message); }
    else stats.merged++;
    return;
  }

  const { error } = await sb.from('events').insert({
    slug: slugify(ev.title, ev.date),
    title: ev.title,
    description: ev.description ?? null,
    date: ev.date,
    start_time: ev.start_time ?? null,
    end_time: ev.end_time ?? null,
    venue_name: ev.venue_name ?? null,
    neighborhood: ev.neighborhood ?? null,
    address: ev.address ?? null,
    lat: ev.lat ?? null,
    lng: ev.lng ?? null,
    genres: ev.genres ?? [],
    lineup: ev.lineup ?? [],
    promoter: ev.promoter ?? null,
    price: ev.price ?? null,
    is_free: ev.is_free ?? false,
    age_restriction: ev.age_restriction ?? null,
    tags: autoTags(ev),
    ticket_url: ev.ticket_url ?? null,
    image_url: ev.image_url ?? null,
    status: 'needs_review',                 // moderation first — always
    source: sourceKind,
    source_url: ev.source_url ?? null,
    source_links: newLink,
    fingerprint: fp,
    last_seen_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === '23505') stats.merged++;   // slug/fingerprint race → already there
    else { stats.skipped++; console.error('insert:', error.message); }
  } else stats.inserted++;
}
