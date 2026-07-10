import { Collected, clamp } from './types';

/**
 * Facebook events — two legitimate paths:
 *
 * 1) GRAPH API (recommended): works for pages you manage or that granted
 *    your app access. Set FB_ACCESS_TOKEN (long-lived page/user token) and
 *    add sources with kind='facebook' whose url is the page id or username,
 *    e.g. url: "nocturna.la" or "1234567890".
 *    Scraping public FB pages without the API violates Meta ToS — don't.
 *
 * 2) APIFY (optional, use consciously): set APIFY_TOKEN + APIFY_FB_ACTOR
 *    (e.g. an actor that takes {startUrls}) and sources with url =
 *    full facebook.com/…/events URL. Apify runs are billed per usage.
 */

export async function collectFacebookGraph(pageIdOrName: string): Promise<Collected[]> {
  const token = process.env.FB_ACCESS_TOKEN;
  if (!token) return [];
  const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageIdOrName)}/events` +
    `?fields=name,start_time,end_time,place,description,cover,ticket_uri,is_online&limit=50&access_token=${token}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const json = await res.json().catch(() => null);
  if (!Array.isArray(json?.data)) return [];

  return json.data
    .filter((e: any) => !e.is_online && e.start_time)
    .map((e: any): Collected => ({
      title: clamp(e.name, 120) ?? 'TBA',
      date: String(e.start_time).slice(0, 10),
      start_time: String(e.start_time).slice(11, 16) || undefined,
      end_time: e.end_time ? String(e.end_time).slice(11, 16) : undefined,
      venue_name: clamp(e.place?.name, 120),
      address: clamp(e.place?.location?.street, 200),
      description: clamp(e.description, 1200),
      image_url: clamp(e.cover?.source, 400),
      ticket_url: clamp(e.ticket_uri, 400),
      source_url: `https://facebook.com/events/${e.id ?? ''}`,
    }));
}

export async function collectFacebookApify(pageUrl: string): Promise<Collected[]> {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env.APIFY_FB_ACTOR; // e.g. "apify~facebook-events-scraper"
  if (!token || !actor) return [];
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}&timeout=120`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startUrls: [{ url: pageUrl }], maxEvents: 50 }),
      signal: AbortSignal.timeout(150000),
    });
  const items = await res.json().catch(() => null);
  if (!Array.isArray(items)) return [];

  return items.map((e: any): Collected => {
    const start = String(e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : e.date ?? e.startDate ?? '');
    return {
      title: clamp(e.name ?? e.title, 120) ?? 'TBA',
      date: start.slice(0, 10),
      start_time: start.length >= 16 ? start.slice(11, 16) : undefined,
      venue_name: clamp(e.place?.name ?? e.location, 120),
      description: clamp(e.description, 1200),
      image_url: clamp(e.photo?.imageUri ?? e.image, 400),
      ticket_url: clamp(e.ticketUrl ?? e.url, 400),
      source_url: clamp(e.url, 400) ?? pageUrl,
    };
  }).filter(c => /^\d{4}-\d{2}-\d{2}$/.test(c.date));
}
