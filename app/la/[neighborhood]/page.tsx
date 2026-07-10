import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';
import SubscribeBand from '@/components/SubscribeBand';
import { getEvents, laToday } from '@/lib/data';
import { NEIGHBORHOODS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ neighborhood: string }> }
): Promise<Metadata> {
  const { neighborhood } = await params;
  const hood = NEIGHBORHOODS.find(n => n.slug === neighborhood);
  if (!hood) return { title: 'Not found' };
  return {
    title: `Electronic music events in ${hood.name}, Los Angeles`,
    description: `Upcoming techno, house and underground events in ${hood.name} — clubs, warehouses and rooftops tracked by Nocturna Compass.`,
  };
}

export default async function NeighborhoodPage(
  { params }: { params: Promise<{ neighborhood: string }> }
) {
  const { neighborhood } = await params;
  const hood = NEIGHBORHOODS.find(n => n.slug === neighborhood);
  if (!hood) notFound();

  const events = await getEvents({ from: laToday(), neighborhood: hood.name });

  return (
    <main>
      <section className="container">
        <div className="eyebrow">Neighborhood guide</div>
        <h1>{hood.name} <em>nights</em></h1>
        <p className="lede">
          Electronic music events in {hood.name} — every club night, warehouse party
          and rooftop session, verified before it reaches this page.
        </p>
        <div className="grid" style={{ marginTop: 44 }}>
          {events.length
            ? events.map(e => <EventCard key={e.id} e={e} />)
            : <div className="empty">Nothing verified in {hood.name} right now — check the full directory.</div>}
        </div>
      </section>
      <SubscribeBand source={`hood_${hood.slug}`} />
    </main>
  );
}
