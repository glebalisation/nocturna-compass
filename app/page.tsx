import Link from 'next/link';
import HomeCompass from '@/components/HomeCompass';
import SubscribeBand from '@/components/SubscribeBand';
import LocationPicker from '@/components/LocationPicker';
import HomeTonightSection from '@/components/HomeTonightSection';
import LAMapBackground from '@/components/LAMapBackground';
import NocturnaLoop from '@/components/NocturnaLoop';
import DecorativeType from '@/components/DecorativeType';
import NeoTribalLines from '@/components/NeoTribalLines';
import { HomeCompassHoverProvider } from '@/components/HomeCompassHover';
import { getEvents, laToday, isDemo } from '@/lib/data';
import { NEIGHBORHOODS, CATEGORIES, type CategorySlug } from '@/lib/types';
import { DEMO_MEDIA } from '@/lib/media';

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

  return (
    <main>
      <HomeCompassHoverProvider>
      <section
        className="container hero-with-compass"
        style={{ paddingTop: 'clamp(40px,6vw,90px)' }}
      >
        <DecorativeType />
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
          <LAMapBackground />
          <NeoTribalLines variant="compass" />
          <HomeCompass events={compassEvents} />
        </div>
      </section>

      <div className="container"><NeoTribalLines variant="divider" /></div>

      <section className="container">
        <div className="section-head">
          <h2>Tonight {district ? <span className="accent">near {district.name}</span> : <span className="accent">in LA</span>}</h2>
          <Link href="/tonight" className="btn btn-ghost btn-sm">All tonight →</Link>
        </div>

        <LocationPicker basePath="/" hood={sp.hood} />

        <HomeTonightSection events={featured} hood={sp.hood} category={sp.category} />
      </section>
      </HomeCompassHoverProvider>

      <section className="container" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>From the <span className="accent">Compass</span> loop</h2>
        </div>
        <NocturnaLoop items={DEMO_MEDIA} />
      </section>

      <SubscribeBand source="homepage" />
    </main>
  );
}
