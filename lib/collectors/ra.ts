import { Collected, clamp } from './types';

/**
 * Resident Advisor — UNOFFICIAL GraphQL endpoint (ra.co/graphql).
 * RA has no public API and their ToS restricts automated access.
 * This adapter is DISABLED unless RA_ENABLED=true — enable only with
 * RA's permission (partners@ra.co) or accept the risk consciously.
 * RA_AREA_ID: LA area id on RA (verify in ra.co/events/us/losangeles
 * network tab; commonly 23 — do check).
 */

const QUERY = `query LISTING($filters: FilterInputDtoInput, $page: Int, $pageSize: Int) {
  eventListings(filters: $filters, pageSize: $pageSize, page: $page) {
    data {
      event {
        title date startTime endTime contentUrl
        images { filename }
        venue { name address }
        artists { name }
        promoters { name }
      }
    }
  }
}`;

export async function collectRA(): Promise<Collected[]> {
  if (process.env.RA_ENABLED !== 'true') return [];
  const area = Number(process.env.RA_AREA_ID ?? 23);
  const gte = new Date().toISOString();
  const lte = new Date(Date.now() + 45 * 86400000).toISOString();

  const res = await fetch('https://ra.co/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; NocturnaCompass/1.0)',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        filters: { areas: { eq: area }, listingDate: { gte, lte } },
        page: 1, pageSize: 100,
      },
    }),
    signal: AbortSignal.timeout(20000),
  });
  const json = await res.json().catch(() => null);
  const rows = json?.data?.eventListings?.data ?? [];

  return rows.map(({ event: e }: any): Collected => ({
    title: clamp(e?.title, 120) ?? 'TBA',
    date: String(e?.date ?? '').slice(0, 10),
    start_time: e?.startTime ? String(e.startTime).slice(11, 16) : undefined,
    end_time: e?.endTime ? String(e.endTime).slice(11, 16) : undefined,
    venue_name: clamp(e?.venue?.name, 120),
    address: clamp(e?.venue?.address, 200),
    lineup: (e?.artists ?? []).map((a: any) => clamp(a?.name, 80)).filter(Boolean),
    promoter: clamp(e?.promoters?.[0]?.name, 120),
    image_url: e?.images?.[0]?.filename ? clamp(e.images[0].filename, 400) : undefined,
    ticket_url: e?.contentUrl ? `https://ra.co${e.contentUrl}` : undefined,
    source_url: e?.contentUrl ? `https://ra.co${e.contentUrl}` : undefined,
  })).filter((c: Collected) => /^\d{4}-\d{2}-\d{2}$/.test(c.date));
}
