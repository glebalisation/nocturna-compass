import type { Metadata } from 'next';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import SubscribeBand from '@/components/SubscribeBand';
import LocationPicker from '@/components/LocationPicker';
import DayNightFader, { type DayNight } from '@/components/DayNightFader';
import { getEvents, laToday } from '@/lib/data';
import { GENRES, NEIGHBORHOODS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Electronic music events tonight in Los Angeles',
  description:
    'Techno, house and underground parties happening tonight in LA. Warehouse events, clubs, rooftops and afterhours — verified daily by Nocturna Compass.',
};

function tonightLink(sp: { genre?: string; free?: string; hood?: string; when?: string }, overrides: Record<string, string | undefined>) {
  const merged = { genre: sp.genre, free: sp.free, hood: sp.hood, when: sp.when, ...overrides };
  const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
  return `/tonight${qs ? '?' + qs : ''}`;
}

export default async function TonightPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; free?: string; hood?: string; when?: string }>;
}) {
  const sp = await searchParams;
  const today = laToday();
  const district = NEIGHBORHOODS.find(n => n.slug === sp.hood);
  const when = sp.when === 'day' || sp.when === 'night' ? sp.when : undefined;
  const events = await getEvents({
    from: today,
    to: today,
    genre: sp.genre,
    free: sp.free === '1',
    when,
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

        <DayNightFader basePath="/tonight" value={when as DayNight} params={{ genre: sp.genre, free: sp.free, hood: sp.hood }} />

        <div className="filters" style={{ marginTop: 36 }}>
          <div className="flabel">Genre</div>
          <Link className={`chip ${!sp.genre ? 'on' : ''}`} href={tonightLink(sp, { genre: undefined })}>All</Link>
          {GENRES.map(g => (
            <Link key={g} className={`chip ${sp.genre === g ? 'on' : ''}`} href={tonightLink(sp, { genre: g })}>
              {g}
            </Link>
          ))}
          <div className="flabel">Price</div>
          <Link className={`chip ${sp.free !== '1' ? 'on' : ''}`} href={tonightLink(sp, { free: undefined })}>Any</Link>
          <Link className={`chip ${sp.free === '1' ? 'on' : ''}`} href={tonightLink(sp, { free: '1' })}>Free</Link>
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
