import type { Metadata } from 'next';
import Link from 'next/link';
import CaliforniaPlanner from '@/components/CaliforniaPlanner';
import { NEIGHBORHOODS } from '@/lib/types';
import { getEvents, laToday } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Map of LA electronic music venues and events',
  description: 'Venues, warehouses, rooftops and pop-ups — clustered by neighborhood across Los Angeles.',
};

export default async function MapPage() {
  const events = await getEvents({ from: laToday() });
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.neighborhood) counts.set(e.neighborhood, (counts.get(e.neighborhood) ?? 0) + 1);
  }

  return (
    <main>
      <div className="container planner-shell">
        <CaliforniaPlanner events={events} />
      </div>
      <section className="container neighborhood-index">
        <div className="section-head">
          <div>
            <div className="eyebrow">California index</div>
            <h2>Los Angeles <em>districts.</em></h2>
          </div>
          <p>Browse the rooms and parties neighborhood by neighborhood.</p>
        </div>
        <div className="neighborhood-list">
          {NEIGHBORHOODS.map(n => (
            <Link key={n.slug} href={`/la/${n.slug}`} className="wk-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{n.name}</b>
              <small>{counts.get(n.name) ?? 0} upcoming events →</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
