import type { Metadata } from 'next';
import Link from 'next/link';
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
      <section className="container">
        <div className="eyebrow">Map view</div>
        <h1>The <em>city map</em></h1>
        <p className="lede">
          Venues, warehouses, rooftops and pop-ups — clustered by neighborhood.
          Interactive map (Mapbox/Leaflet) lands in the next release; the neighborhood
          index below is live now.
        </p>
        <div style={{ marginTop: 44, maxWidth: 640 }}>
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
