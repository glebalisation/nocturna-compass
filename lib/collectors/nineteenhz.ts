import { Collected, clamp, laToday } from './types';

/**
 * 19hz.info — volunteer-run public listing, the best free LA underground source.
 * Page is a plain HTML table: Date | Event@Venue | Genres | Price/Age | Organizer | Links.
 * Best-effort parse; everything still lands in the moderation queue.
 * Courtesy: email 19hzinfo@gmail.com before heavy automated use.
 */

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function strip(html: string): string {
  return html.replace(/<br\s*\/?>/gi, ' · ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
}

/** "Fri: Jul 11" / "Sat: Aug 2" → YYYY-MM-DD (year inferred, LA-local). */
function parseDate(cell: string): string | null {
  const m = cell.match(/([A-Za-z]{3})\s+(\d{1,2})/);
  if (!m) return null;
  const mm = MONTHS[m[1].toLowerCase()];
  if (!mm) return null;
  const dd = m[2].padStart(2, '0');
  const today = laToday();                    // YYYY-MM-DD
  const thisYear = today.slice(0, 4);
  let date = `${thisYear}-${mm}-${dd}`;
  // listing is future-only: if it looks past, it's next year
  if (date < today) date = `${Number(thisYear) + 1}-${mm}-${dd}`;
  return date;
}

export function collect19hz(html: string, pageUrl: string): Collected[] {
  const out: Collected[] = [];
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rows) {
    const cells = (row.match(/<td[\s\S]*?<\/td>/gi) ?? []).map(strip);
    if (cells.length < 2) continue;
    const date = parseDate(cells[0]);
    if (!date) continue;

    // "Event Name @ Venue" (sometimes with time in parens)
    const main = cells[1];
    const at = main.split('@');
    const title = clamp(at[0]?.replace(/\(.*?\)/g, ''), 120);
    if (!title || title.length < 3) continue;
    const venue = clamp(at[1]?.split('·')[0]?.replace(/\(.*?\)/g, ''), 120);

    const timeM = main.match(/(\d{1,2})(?::(\d{2}))?\s*([ap]m)/i);
    let start_time: string | undefined;
    if (timeM) {
      let h = parseInt(timeM[1], 10) % 12;
      if (timeM[3].toLowerCase() === 'pm') h += 12;
      start_time = `${String(h).padStart(2, '0')}:${timeM[2] ?? '00'}`;
    }

    const genres = (cells[2] ?? '').split(/[,/·]/).map(s => s.trim().toLowerCase())
      .filter(s => s && s.length < 24).slice(0, 5);
    const priceCell = cells[3] ?? '';
    const age = priceCell.match(/(\d{2})\+/)?.[0];
    const linkM = row.match(/href=["'](https?:\/\/[^"']+)["']/i);

    out.push({
      title, date, start_time,
      venue_name: venue,
      genres,
      price: clamp(priceCell.replace(/\d{2}\+/, '').replace(/[|·]/g, '').trim(), 40) || undefined,
      is_free: /free|\$0/i.test(priceCell),
      age_restriction: age,
      promoter: clamp(cells[4], 120),
      ticket_url: linkM ? clamp(linkM[1], 400) : undefined,
      source_url: pageUrl,
    });
  }
  return out;
}
