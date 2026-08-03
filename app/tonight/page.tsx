import type { Metadata } from 'next';
import SubscribeBand from '@/components/SubscribeBand';
import LocationPicker from '@/components/LocationPicker';
import TonightEventsSection from '@/components/TonightEventsSection';
import { getEvents, laToday } from '@/lib/data';
import { NEIGHBORHOODS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Electronic music events tonight in Los Angeles',
  description:
    'Techno, house and underground parties happening tonight in LA. Warehouse events, clubs, rooftops and afterhours — verified daily by Nocturna Compass.',
};

export default async function TonightPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; free?: string; hood?: string }>;
}) {
  const sp = await searchParams;
  const today = laToday();
  const district = NEIGHBORHOODS.find(n => n.slug === sp.hood);
  const events = await getEvents({
    from: today,
    to: today,
    genre: sp.genre,
    free: sp.free === '1',
    neighborhood: district?.name,
  });

  return (
    <main>
      <section className="container">
        <div className="eyebrow">Updated daily · {today}</div>
        <h1>Tonight {district ? <>near <em>{district.name}</em></> : <em>in LA</em>}</h1>
        <p className="lede">
          Every electronic event happening across Los Angeles today — techno, house,
          warehouse parties, rooftops and afterhours. Verified by the Nocturna team.
        </p>

        <LocationPicker basePath="/tonight" hood={sp.hood} />

        <TonightEventsSection events={events} genre={sp.genre} free={sp.free} hood={sp.hood} />
      </section>
      <SubscribeBand source="tonight" />
    </main>
  );
}
