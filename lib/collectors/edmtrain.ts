import { Collected, clamp } from './types';

/**
 * EDMTrain — OFFICIAL API (https://edmtrain.com/api-documentation).
 * Requires EDMTRAIN_API_KEY (free) and EDMTRAIN_ENABLED=true.
 *
 * ⚠️ ToS WARNING: EDMTrain's API terms forbid using their data in "an event
 * discovery service that combines our events with other event sources".
 * Nocturna Compass combines sources — get written permission from
 * api@edmtrain.com BEFORE enabling, or keep this adapter off.
 * Per ToS you must also show their unmodified event link (we store it as
 * ticket_url/source_url) and not cache data older than 24h (nightly run = ok).
 */

let laLocationId: number | null = null;

async function locationId(key: string): Promise<number | null> {
  if (laLocationId) return laLocationId;
  const res = await fetch(
    `https://edmtrain.com/api/locations?city=Los+Angeles&state=California&client=${key}`,
    { signal: AbortSignal.timeout(15000) });
  const json = await res.json().catch(() => null);
  laLocationId = json?.data?.[0]?.id ?? null;
  return laLocationId;
}

export async function collectEdmtrain(): Promise<Collected[]> {
  if (process.env.EDMTRAIN_ENABLED !== 'true') return [];
  const key = process.env.EDMTRAIN_API_KEY;
  if (!key) return [];
  const loc = await locationId(key);
  if (!loc) return [];

  const res = await fetch(
    `https://edmtrain.com/api/events?locationIds=${loc}&client=${key}`,
    { signal: AbortSignal.timeout(20000) });
  const json = await res.json().catch(() => null);
  if (!json?.success || !Array.isArray(json.data)) return [];

  return json.data.slice(0, 300).map((e: any): Collected => ({
    title: clamp(e.name, 120) ?? clamp((e.artistList ?? []).map((a: any) => a.name).join(', '), 120) ?? 'TBA',
    date: String(e.date ?? '').slice(0, 10),
    start_time: e.startTime ? String(e.startTime).slice(11, 16) : undefined,
    venue_name: clamp(e.venue?.name, 120),
    address: clamp(e.venue?.address, 200),
    lineup: (e.artistList ?? []).map((a: any) => clamp(a.name, 80)).filter(Boolean),
    age_restriction: clamp(e.ages, 12),
    tags: e.festivalInd ? ['festival'] : [],
    ticket_url: clamp(e.link, 400),          // ToS: unmodified event link
    source_url: clamp(e.link, 400),
  })).filter((c: Collected) => /^\d{4}-\d{2}-\d{2}$/.test(c.date));
}
