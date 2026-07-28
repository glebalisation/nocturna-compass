/** Normalized event coming out of any collector, before merge/moderation. */
export interface Collected {
  title: string;
  date: string;               // YYYY-MM-DD (LA local)
  start_time?: string;        // HH:MM
  end_time?: string;
  venue_name?: string;
  address?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  genres?: string[];
  lineup?: string[];
  promoter?: string;
  price?: string;
  is_free?: boolean;
  age_restriction?: string;   // '18+' | '21+' | 'all ages'
  tags?: string[];
  ticket_url?: string;
  image_url?: string;
  source_url?: string;        // canonical page for THIS listing
  description?: string;
}

export interface SourceRow {
  id: string; name: string; url: string; kind: string; active: boolean;
}

export const laToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());

export const clamp = (s: unknown, max: number) =>
  typeof s === 'string' ? s.trim().slice(0, max) : undefined;

/** Derive tags from text signals (genres, price, venue type words). */
export function autoTags(c: Collected): string[] {
  const hay = [c.title, c.description, (c.genres ?? []).join(' '), c.venue_name]
    .filter(Boolean).join(' ').toLowerCase();
  const tags = new Set(c.tags ?? []);
  const add = (t: string, re: RegExp) => { if (re.test(hay)) tags.add(t); };
  add('techno', /techno/); add('house', /house/); add('melodic', /melodic|progressive/);
  add('bass', /\bbass\b|dubstep|dnb|drum\s*(&|and)\s*bass/); add('warehouse', /warehouse/);
  add('rooftop', /rooftop/); add('festival', /festival/); add('afterhours', /after\s*hours|afterhours|\b4\s*am\b/);
  if (c.is_free || /free/i.test(c.price ?? '')) tags.add('free');
  if (c.age_restriction === '21+') tags.add('21+');
  return [...tags];
}
