import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EventCard from '@/components/EventCard';
import SubscribeBand from '@/components/SubscribeBand';
import TicketLink from '@/components/TicketLink';
import { getEventBySlug, getEvents } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) return { title: 'Event not found' };
  return {
    title: `${e.title} — ${e.venue_name ?? 'Los Angeles'} · ${e.date}`,
    description:
      e.description ??
      `${e.title} at ${e.venue_name ?? 'a Los Angeles venue'} on ${e.date}. Lineup: ${e.lineup.join(', ')}. ${e.genres.join(', ')} in LA.`,
  };
}

function fmtLong(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles',
  });
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) notFound();

  const similar = (await getEvents({ genre: e.genres[0], limit: 4 }))
    .filter(x => x.slug !== e.slug)
    .slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: e.title,
    startDate: e.start_time ? `${e.date}T${e.start_time}:00-08:00` : e.date,
    location: {
      '@type': 'Place',
      name: e.secret_location ? 'Secret location (Los Angeles)' : e.venue_name,
      address: e.address ?? `${e.neighborhood ?? ''}, Los Angeles, CA`,
    },
    performer: e.lineup.map(name => ({ '@type': 'MusicGroup', name })),
    offers: e.ticket_url
      ? { '@type': 'Offer', url: e.ticket_url, price: e.is_free ? '0' : undefined }
      : undefined,
    image: e.image_url ?? undefined,
    description: e.description ?? undefined,
  };

  const lightness = 14 + (e.title.length * 3) % 10;
  const visualStyle = e.image_url
    ? { backgroundImage: `url(${e.image_url})` }
    : { background: `radial-gradient(120% 90% at 24% 10%, hsl(220 8% ${lightness + 8}%) 0%, transparent 60%), radial-gradient(100% 100% at 80% 90%, hsl(220 6% ${lightness}%) 0%, #05070B 70%)` };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container">
        <div className="event-hero">
          <div className="visual" style={visualStyle} />
          <div style={{ padding: 'clamp(20px,3vw,36px)' }}>
            <div className="eyebrow">{fmtLong(e.date)}{e.start_time ? ` · ${e.start_time}${e.end_time ? ' — ' + e.end_time : ''}` : ''}</div>
            <h1 style={{ fontSize: 'clamp(30px,4.6vw,60px)' }}>{e.title}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
              {e.genres.map(g => <span key={g} className="tag">{g}</span>)}
              {(e.tags ?? []).filter(t => !e.genres.includes(t)).map(t => <span key={t} className="tag">{t}</span>)}
              {e.secret_location && <span className="tag">secret location</span>}
              {e.guest_list && <span className="tag">guest list</span>}
              {e.age_restriction && <span className="tag">{e.age_restriction}</span>}
            </div>
          </div>
        </div>

        <div className="event-detail">
          <div>
            {e.lineup.length > 0 && (
              <>
                <div className="eyebrow">Lineup</div>
                <p style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>
                  {e.lineup.join(' · ')}
                </p>
              </>
            )}
            {e.description && (
              <p className="lede" style={{ marginTop: 24, maxWidth: 640 }}>{e.description}</p>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
              {e.ticket_url && <TicketLink eventId={e.id} href={e.ticket_url} className="btn btn-primary">Get tickets</TicketLink>}
              {e.ra_url && <a className="btn btn-ghost" href={e.ra_url} target="_blank" rel="noopener">Resident Advisor</a>}
              {e.instagram_url && <a className="btn btn-ghost" href={e.instagram_url} target="_blank" rel="noopener">Instagram</a>}
            </div>
          </div>
          <aside className="fact-list">
            <div className="fact"><b>Venue</b><span>{e.secret_location ? 'Revealed on the day' : (e.venue_name ?? 'TBA')}</span></div>
            <div className="fact"><b>Area</b><span>{e.neighborhood ?? 'Los Angeles'}</span></div>
            {e.address && !e.secret_location && <div className="fact"><b>Address</b><span>{e.address}</span></div>}
            <div className="fact"><b>Price</b><span>{e.is_free ? 'Free' : (e.price ?? 'TBA')}</span></div>
            {e.promoter && <div className="fact"><b>Promoter</b><span>{e.promoter}</span></div>}
            {e.age_restriction && <div className="fact"><b>Ages</b><span>{e.age_restriction}</span></div>}
            <div className="fact"><b>Source</b><span>{e.source === 'submission' ? 'Community' : 'Verified by Nocturna'}</span></div>
          </aside>
        </div>

        {similar.length > 0 && (
          <div style={{ marginTop: 72 }}>
            <div className="section-head">
              <h2 style={{ fontSize: 'clamp(24px,3vw,38px)' }}>Similar <span className="accent">directions</span></h2>
              <Link href="/events" className="btn btn-ghost btn-sm">All events →</Link>
            </div>
            <div className="grid">{similar.map(x => <EventCard key={x.id} e={x} />)}</div>
          </div>
        )}
      </section>
      <SubscribeBand source="event_page" />
    </main>
  );
}
