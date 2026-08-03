import { supabasePublic } from './supabase';
import type { NocturnaEvent, CategorySlug } from './types';
import { CATEGORIES, eventCategory } from './types';
import { DAY_START, DAY_NIGHT_CUTOFF, isDaytime, isNighttime } from './dayNight';

const NON_MUSIC_CATEGORY_SLUGS = CATEGORIES.map(c => c.slug).filter(s => s !== 'music');

/* ------------------------------------------------------------------ */
/* Demo seed: the site works out of the box before Supabase is wired.  */
/* Once NEXT_PUBLIC_SUPABASE_URL is set, real data replaces this.      */
/* ------------------------------------------------------------------ */

function iso(d: Date) { return d.toISOString().slice(0, 10); }
const today = new Date();
const plus = (n: number) => iso(new Date(today.getTime() + n * 86400000));

export const DEMO_EVENTS: NocturnaEvent[] = [
  { id: 'd1', slug: 'concrete-ritual-' + plus(0), title: 'Concrete Ritual', date: plus(0), start_time: '22:00', end_time: '06:00', venue_name: 'Vault 1904', neighborhood: 'Downtown LA', lat: 34.0407, lng: -118.2468, genres: ['techno'], lineup: ['Vera Holt', 'MODUL8', 'Iker Sanz'], price: '$25', status: 'featured', featured: true, source: 'manual', description: 'Peak-time warehouse techno in a 1904 bank vault. Concrete, strobes, a Funktion-One rig and nothing else.' },
  { id: 'd2', slug: 'glasshouse-sessions-' + plus(0), title: 'Glasshouse Sessions', date: plus(0), start_time: '21:00', venue_name: 'The Greenhouse', neighborhood: 'Arts District', lat: 34.0341, lng: -118.2334, genres: ['house'], lineup: ['Ama Diallo', 'Soft Static'], price: '$18', status: 'approved', source: 'manual' },
  { id: 'd3', slug: 'static-bloom-' + plus(0), title: 'Static Bloom', date: plus(0), start_time: '23:00', venue_name: 'Basement Echo', neighborhood: 'Echo Park', lat: 34.0781, lng: -118.2606, genres: ['electro'], lineup: ['Nocturna residents', 'Kito Vance'], is_free: true, price: 'Free RSVP', status: 'approved', source: 'manual' },
  { id: 'd4', slug: 'sable-sundown-' + plus(1), title: 'Sable Sundown', date: plus(1), start_time: '18:00', venue_name: 'Sable Rooftop', neighborhood: 'Hollywood', lat: 34.1016, lng: -118.3269, genres: ['house'], lineup: ['Lena Marlow (open to close)'], price: '$20', status: 'approved', source: 'manual' },
  { id: 'd5', slug: 'meridian-all-night-' + plus(2), title: 'Meridian All Night', date: plus(2), start_time: '23:00', venue_name: 'Undisclosed', neighborhood: 'Downtown LA', secret_location: true, genres: ['techno'], lineup: ['Raum Kollektiv'], price: '$30', status: 'featured', featured: true, source: 'manual' },
  { id: 'd6', slug: 'low-orbit-' + plus(2), title: 'Low Orbit', date: plus(2), start_time: '22:00', venue_name: 'Signal Room', neighborhood: 'Silver Lake', lat: 34.0900, lng: -118.2708, genres: ['minimal'], lineup: ['Hishi Tanaka', 'Grain Theory'], price: '$15', status: 'approved', source: 'manual' },
  { id: 'd7', slug: 'afterlight-' + plus(3), title: 'Afterlight', date: plus(3), start_time: '04:00', venue_name: 'Room Zero', neighborhood: 'Downtown LA', lat: 34.0455, lng: -118.2506, genres: ['techno'], lineup: ['Rotating residents'], price: '$20', status: 'approved', source: 'manual' },
  { id: 'd8', slug: 'pier-static-day-series-' + plus(4), title: 'Pier Static — Day Series', date: plus(4), start_time: '14:00', venue_name: 'Ocean Deck', neighborhood: 'Venice', lat: 33.9850, lng: -118.4695, genres: ['house'], lineup: ['Coastal Frequencies crew'], is_free: true, price: 'Free', status: 'approved', source: 'manual' },
  { id: 'd9', slug: 'concrete-and-light-' + plus(1), title: 'Concrete & Light', date: plus(1), start_time: '11:00', end_time: '18:00', venue_name: 'Bendix Building', neighborhood: 'Downtown LA', lat: 34.0448, lng: -118.2523, genres: [], lineup: ['LA Sculpture Collective'], tags: ['art'], indoor: true, is_free: true, price: 'Free', status: 'approved', source: 'manual', description: 'A one-day group show of light and concrete installations from LA sculptors.' },
  { id: 'd10', slug: 'night-signals-film-' + plus(3), title: 'Night Signals: A Film Night', date: plus(3), start_time: '20:00', venue_name: 'Regent Theater', neighborhood: 'Downtown LA', lat: 34.0442, lng: -118.2506, genres: [], lineup: ['Independent LA filmmakers'], tags: ['film'], indoor: true, price: '$12', status: 'approved', source: 'manual' },
];

export function isDemo(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/* ------------------------------------------------------------------ */

export interface EventQuery {
  from?: string;      // YYYY-MM-DD inclusive
  to?: string;        // YYYY-MM-DD inclusive
  genre?: string;
  tag?: string;       // tags[] contains
  category?: CategorySlug;
  indoor?: boolean;
  when?: 'day' | 'night'; // start_time before/after 18:00 (06:00-18:00 counts as day)
  neighborhood?: string;
  free?: boolean;
  q?: string;         // search: title / venue / promoter / lineup
  limit?: number;
}

export async function getEvents(q: EventQuery = {}): Promise<NocturnaEvent[]> {
  const sb = supabasePublic();
  if (!sb) {
    const needle = q.q?.toLowerCase();
    return DEMO_EVENTS.filter(e =>
      (!q.from || e.date >= q.from) &&
      (!q.to || e.date <= q.to) &&
      (!q.genre || e.genres.includes(q.genre)) &&
      (!q.tag || (e.tags ?? []).includes(q.tag) || e.genres.includes(q.tag)) &&
      (!q.category || eventCategory(e) === q.category) &&
      (q.indoor === undefined || (e.indoor ?? true) === q.indoor) &&
      (!q.when || (q.when === 'day' ? isDaytime(e.start_time) : isNighttime(e.start_time))) &&
      (!q.neighborhood || e.neighborhood === q.neighborhood) &&
      (!q.free || e.is_free) &&
      (!needle ||
        e.title.toLowerCase().includes(needle) ||
        (e.venue_name ?? '').toLowerCase().includes(needle) ||
        e.lineup.some(a => a.toLowerCase().includes(needle)))
    ).slice(0, q.limit ?? 100);
  }

  let query = sb.from('events')
    .select('*')
    .in('status', ['approved', 'featured'])
    .order('date', { ascending: true })
    .order('featured', { ascending: false })
    .limit(q.limit ?? 100);

  if (q.from) query = query.gte('date', q.from);
  if (q.to) query = query.lte('date', q.to);
  if (q.genre) query = query.contains('genres', [q.genre]);
  if (q.tag) query = query.contains('tags', [q.tag]);
  if (q.category === 'music') query = query.not('tags', 'ov', `{${NON_MUSIC_CATEGORY_SLUGS.join(',')}}`);
  else if (q.category) query = query.contains('tags', [q.category]);
  if (q.indoor !== undefined) query = query.eq('indoor', q.indoor);
  if (q.when === 'day') query = query.gte('start_time', DAY_START).lt('start_time', DAY_NIGHT_CUTOFF);
  else if (q.when === 'night') query = query.or(`start_time.gte.${DAY_NIGHT_CUTOFF},start_time.lt.${DAY_START}`);
  if (q.neighborhood) query = query.eq('neighborhood', q.neighborhood);
  if (q.free) query = query.eq('is_free', true);
  if (q.q) {
    const safe = q.q.replace(/[,%()]/g, ' ').trim().slice(0, 60);
    if (safe) query = query.or(
      `title.ilike.%${safe}%,venue_name.ilike.%${safe}%,promoter.ilike.%${safe}%`
    );
  }

  const { data, error } = await query;
  if (error) { console.error('getEvents:', error.message); return []; }
  return (data ?? []) as NocturnaEvent[];
}

export async function getEventBySlug(slug: string): Promise<NocturnaEvent | null> {
  const sb = supabasePublic();
  if (!sb) return DEMO_EVENTS.find(e => e.slug === slug) ?? null;
  const { data } = await sb.from('events')
    .select('*')
    .eq('slug', slug)
    .in('status', ['approved', 'featured'])
    .maybeSingle();
  return (data as NocturnaEvent) ?? null;
}

/** Date helpers (America/Los_Angeles) */
export function laToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
}
export function laWeekend(): { from: string; to: string } {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = now.getDay(); // 0 Sun … 6 Sat
  const toFriday = day <= 5 ? 5 - day : 6; // next (or current) Friday
  const fri = new Date(now.getTime() + toFriday * 86400000);
  const sun = new Date(fri.getTime() + 2 * 86400000);
  const f = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(d);
  // if it's already Sat/Sun, weekend started yesterday/two days ago
  if (day === 6) return { from: f(new Date(now.getTime() - 86400000)), to: f(new Date(now.getTime() + 86400000)) };
  if (day === 0) return { from: f(new Date(now.getTime() - 2 * 86400000)), to: f(now) };
  return { from: f(fri), to: f(sun) };
}


/** Resolve day shortcuts (week / weekend / fri / sat / sun) to a date range. */
export function dayRange(day?: string): { from: string; to?: string } {
  const today = laToday();
  if (!day || day === 'all') return { from: today };
  if (day === 'week') {
    const end = new Date(new Date(today + 'T12:00:00').getTime() + 7 * 86400000);
    return { from: today, to: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(end) };
  }
  if (day === 'weekend') return laWeekend();
  const idx: Record<string, number> = { fri: 5, sat: 6, sun: 0 };
  if (day in idx) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    let delta = (idx[day] - now.getDay() + 7) % 7;   // next such day (today counts)
    const d = new Date(now.getTime() + delta * 86400000);
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(d);
    return { from: f, to: f };
  }
  return { from: today };
}
