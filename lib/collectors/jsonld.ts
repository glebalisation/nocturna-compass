import { Collected, clamp } from './types';

/** Extract schema.org Event objects from any HTML page (DICE, DoLA, Eventbrite,
 *  Shotgun and most venue/promoter sites embed them). */
export function collectJsonLd(html: string, pageUrl: string): Collected[] {
  const out: Collected[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let parsed: unknown;
    try { parsed = JSON.parse(m[1]); } catch { continue; }
    const nodes = Array.isArray(parsed)
      ? parsed
      : (parsed as Record<string, unknown>)['@graph'] as unknown[] ?? [parsed];
    for (const raw of nodes) {
      const node = raw as Record<string, any>;
      if (!/Event/i.test(String(node['@type'] ?? ''))) continue;
      const start = String(node.startDate ?? '');
      const end = String(node.endDate ?? '');
      const date = start.slice(0, 10);
      if (!node.name || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const performers = ([] as any[]).concat(node.performer ?? []);
      const offers = ([] as any[]).concat(node.offers ?? [])[0];
      out.push({
        title: clamp(node.name, 120)!,
        date,
        start_time: start.length >= 16 ? start.slice(11, 16) : undefined,
        end_time: end.length >= 16 ? end.slice(11, 16) : undefined,
        venue_name: clamp(node.location?.name, 120),
        address: clamp(
          typeof node.location?.address === 'string'
            ? node.location.address
            : node.location?.address?.streetAddress, 200),
        lineup: performers.map(p => clamp(p?.name, 80)).filter(Boolean) as string[],
        promoter: clamp(node.organizer?.name, 120),
        price: offers?.price != null ? String(offers.price) : undefined,
        is_free: String(node.isAccessibleForFree) === 'true' || offers?.price === 0,
        ticket_url: clamp(offers?.url ?? node.url, 400),
        image_url: clamp(typeof node.image === 'string' ? node.image : node.image?.[0], 400),
        description: clamp(node.description, 1200),
        source_url: clamp(node.url, 400) ?? pageUrl,
      });
    }
  }
  return out;
}
