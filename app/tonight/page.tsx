import type { Metadata } from 'next';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import SubscribeBand from '@/components/SubscribeBand';
import { getEvents, laToday } from '@/lib/data';
import { GENRES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Electronic music events tonight in Los Angeles',
  description:
    'Techno, house and underground parties happening tonight in LA. Warehouse events, clubs, rooftops and afterhours — verified daily by Nocturna Compass.',
};

export default async function TonightPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; free?: string }>;
}) {
  const sp = await searchParams;
  const today = laToday();
  const events = await getEvents({
    from: today,
    to: today,
    genre: sp.genre,
    free: sp.free === '1',
  });

  return (
    <main>
      <section className="container">
        <div className="eyebrow">Updated daily · {today}</div>
        <h1>Tonight <em>in LA</em></h1>
        <p className="lede">
          Every electronic event happening across Los Angeles today — techno, house,
          warehouse parties, rooftops and afterhours. Verified by the Nocturna team.
        </p>

        <div className="filters" style={{ marginTop: 36 }}>
          <div className="flabel">Genre</div>
          <Link className={`chip ${!sp.genre ? 'on' : ''}`} href="/tonight">All</Link>
          {GENRES.map(g => (
            <Link key={g} className={`chip ${sp.genre === g ? 'on' : ''}`} href={`/tonight?genre=${g}`}>
              {g}
            </Link>
          ))}
          <div className="flabel">Price</div>
          <Link className={`chip ${sp.free !== '1' ? 'on' : ''}`} href="/tonight">Any</Link>
          <Link className={`chip ${sp.free === '1' ? 'on' : ''}`} href="/tonight?free=1">Free</Link>
        </div>

        <div className="grid">
          {events.length
            ? events.map(e => <EventCard key={e.id} e={e} />)
            : <div className="empty">No verified events for tonight yet — the weekend guide is live.</div>}
        </div>
      </section>
      <SubscribeBand source="tonight" />
    </main>
  );
}
