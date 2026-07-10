import type { Metadata } from 'next';
import Link from 'next/link';
import SubscribeBand from '@/components/SubscribeBand';
import { getEvents, laWeekend } from '@/lib/data';
import type { NocturnaEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'This weekend in LA — electronic music guide',
  description:
    'The curated Friday–Sunday guide to electronic music in Los Angeles: warehouse parties, club nights, rooftops and open airs picked by Nocturna editors.',
};

function dayName(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' });
}

export default async function WeekendPage() {
  const { from, to } = laWeekend();
  const events = await getEvents({ from, to });

  const byDay = new Map<string, NocturnaEvent[]>();
  for (const e of events) {
    if (!byDay.has(e.date)) byDay.set(e.date, []);
    byDay.get(e.date)!.push(e);
  }
  const days = [...byDay.keys()].sort();

  return (
    <main>
      <section className="container">
        <div className="eyebrow">{from} → {to}</div>
        <h1>This <em>weekend</em></h1>
        <p className="lede">
          The curated Friday–Sunday route. Three nights, one direction — picked by
          editors, not algorithms.
        </p>

        <div className="wk-grid" style={{ marginTop: 44 }}>
          {days.length ? days.map(d => (
            <div className="wk-col" key={d}>
              <h3>{dayName(d)} <span style={{ float: 'right' }}>{d.slice(5)}</span></h3>
              {byDay.get(d)!.map(e => (
                <Link key={e.id} href={`/events/${e.slug}`} className="wk-item">
                  <b>{e.title}</b>
                  <small>
                    {e.secret_location ? 'Secret · TBA' : e.venue_name} · {e.neighborhood}
                    {e.start_time ? ` · ${e.start_time}` : ''} · {e.genres.join('/')}
                  </small>
                </Link>
              ))}
            </div>
          )) : <div className="empty" style={{ gridColumn: '1/-1' }}>Weekend picks drop every Thursday.</div>}
        </div>
      </section>
      <SubscribeBand source="weekend" />
    </main>
  );
}
