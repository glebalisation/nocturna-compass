import Link from 'next/link';
import EventCard from '@/components/EventCard';
import HomeCompass from '@/components/HomeCompass';
import SubscribeBand from '@/components/SubscribeBand';
import LocationPicker from '@/components/LocationPicker';
import { getEvents, laToday, isDemo } from '@/lib/data';
import { NEIGHBORHOODS, CATEGORIES, type CategorySlug } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ hood?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const district = NEIGHBORHOODS.find(n => n.slug === sp.hood);
  const category = CATEGORIES.find(c => c.slug === sp.category)?.slug as CategorySlug | undefined;

  const today = laToday();
  const tonight = await getEvents({ from: today, to: today, neighborhood: district?.name, category, limit: 6 });
  const upcoming = await getEvents({ from: today, neighborhood: district?.name, category, limit: 6 });
  const compassEvents = await getEvents({ from: today, limit: 20 });
  const featured = tonight.length ? tonight : upcoming;
  const homeLink = (params: Record<string, string | undefined>) => {
    const merged = { hood: sp.hood, category: sp.category, ...params };
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
    return `/${qs ? '?' + qs : ''}`;
  };

  return (
    <main>
      <section className="container hero-with-compass" style={{ paddingTop: 'clamp(40px,6vw,90px)' }}>
        <div>
          <div className="eyebrow">Los Angeles · Underground Intelligence</div>
          <h1>What&rsquo;s happening beneath the surface.</h1>
          <p className="lede">
            Nocturna Compass tracks the best electronic music events, warehouse parties,
            clubs, DJs and underground gatherings across Los Angeles — curated, verified,
            and mapped every week.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 36 }}>
            <Link href="/#subscribe" className="btn btn-primary">Get the weekly LA underground guide</Link>
            <Link href="/tonight" className="btn btn-ghost">Explore events tonight</Link>
          </div>
          {isDemo() && (
            <div className="notice" style={{ maxWidth: 620 }}>
              Demo mode — connect Supabase in .env to show real events.
            </div>
          )}
        </div>
        <div className="home-compass-cell">
          <HomeCompass events={compassEvents} />
        </div>
      </section>

      <section className="container">
        <div className="section-head">
          <h2>Tonight {district ? <span className="accent">near {district.name}</span> : <span className="accent">in LA</span>}</h2>
          <Link href="/tonight" className="btn btn-ghost btn-sm">All tonight →</Link>
        </div>

        <LocationPicker basePath="/" hood={sp.hood} />

        <div className="filters" style={{ marginTop: 18 }}>
          <Link className={`chip ${!sp.category ? 'on' : ''}`} href={homeLink({ category: undefined })}>All</Link>
          {CATEGORIES.map(c => (
            <Link key={c.slug} className={`chip ${sp.category === c.slug ? 'on' : ''}`} href={homeLink({ category: sp.category === c.slug ? undefined : c.slug })}>
              {c.name}
            </Link>
          ))}
        </div>

        <div className="grid" style={{ marginTop: 26 }}>
          {featured.length
            ? featured.map(e => <EventCard key={e.id} e={e} />)
            : <div className="empty">Tonight is quiet — check the weekend guide.</div>}
        </div>
      </section>

      <SubscribeBand source="homepage" />
    </main>
  );
}
