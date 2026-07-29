import Link from 'next/link';
import EventCard from '@/components/EventCard';
import HomeCompass from '@/components/HomeCompass';
import SubscribeBand from '@/components/SubscribeBand';
import { getEvents, laToday, isDemo } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today = laToday();
  const tonight = await getEvents({ from: today, to: today, limit: 6 });
  const upcoming = await getEvents({ from: today, limit: 6 });
  const compassEvents = await getEvents({ from: today, limit: 20 });
  const featured = tonight.length ? tonight : upcoming;

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
          <h2>Tonight <span className="accent">in LA</span></h2>
          <Link href="/tonight" className="btn btn-ghost btn-sm">All tonight →</Link>
        </div>
        <div className="grid">
          {featured.length
            ? featured.map(e => <EventCard key={e.id} e={e} />)
            : <div className="empty">Tonight is quiet — check the weekend guide.</div>}
        </div>
      </section>

      <SubscribeBand source="homepage" />
    </main>
  );
}
