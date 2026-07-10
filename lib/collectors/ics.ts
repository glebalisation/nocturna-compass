import { Collected, clamp } from './types';

/** Minimal iCalendar parser (venue/promoter public calendars). */
export function collectIcs(ics: string): Collected[] {
  const out: Collected[] = [];
  const unfold = ics.replace(/\r?\n[ \t]/g, ''); // RFC5545 line folding
  for (const b of unfold.split('BEGIN:VEVENT').slice(1)) {
    const get = (k: string) => b.match(new RegExp(`^${k}[^:\\n]*:(.+)$`, 'm'))?.[1]?.trim();
    const title = get('SUMMARY');
    const dt = get('DTSTART');
    if (!title || !dt) continue;
    const date = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const dtEnd = get('DTEND');
    out.push({
      title: clamp(title, 120)!,
      date,
      start_time: dt.length >= 13 ? `${dt.slice(9, 11)}:${dt.slice(11, 13)}` : undefined,
      end_time: dtEnd && dtEnd.length >= 13 ? `${dtEnd.slice(9, 11)}:${dtEnd.slice(11, 13)}` : undefined,
      venue_name: clamp(get('LOCATION')?.replace(/\\,/g, ','), 120),
      description: clamp(get('DESCRIPTION')?.replace(/\\n/g, ' ').replace(/\\,/g, ','), 1200),
      ticket_url: clamp(get('URL'), 400),
      source_url: clamp(get('URL'), 400),
    });
  }
  return out;
}
