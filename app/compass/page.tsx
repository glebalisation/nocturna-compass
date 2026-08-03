import type { Metadata } from 'next';
import CompassDial from '@/components/CompassDial';
import { getEvents, dayRange } from '@/lib/data';
import { hasCoords } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Compass — find the closest party',
  description:
    'Point your phone toward LA nightlife. Nocturna Compass finds the closest verified party right now and leads you there.',
};

export default async function CompassPage() {
  const range = dayRange('week');
  const events = await getEvents({ from: range.from, to: range.to, limit: 200 });
  const located = events.filter(hasCoords);

  return (
    <main>
      <section className="container compass-page">
        <div className="compass-map-bg" aria-hidden="true">
          <img src="/la-map.webp" alt="" />
        </div>
        <div className="eyebrow">Live · this week</div>
        <h1>Find the <em>closest party</em></h1>
        <p className="lede">
          Point your phone toward the night — the needle swings to whichever verified
          Nocturna event is nearest you right now.
        </p>
        <CompassDial events={located} />
      </section>
    </main>
  );
}
