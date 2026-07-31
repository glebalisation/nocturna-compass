import type { Metadata } from 'next';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import SubscribeBand from '@/components/SubscribeBand';
import { getEvents, dayRange } from '@/lib/data';
import { GENRES, NEIGHBORHOODS, CATEGORIES, type CategorySlug } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'All electronic music events in Los Angeles',
  description:
    'The full directory of upcoming electronic music events in LA — search by artist, venue or genre; filter by day, neighborhood, free events, warehouse and underground parties.',
};

const DAYS = [
  { v: 'all', label: 'All upcoming' },
  { v: 'week', label: 'This week' },
  { v: 'weekend', label: 'This weekend' },
  { v: 'fri', label: 'Friday' },
  { v: 'sat', label: 'Saturday' },
  { v: 'sun', label: 'Sunday' },
] as const;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; hood?: string; free?: string; day?: string; tag?: string; q?: string; featured?: string; category?: string; indoor?: string }>;
}) {
  const sp = await searchParams;
  const hood = NEIGHBORHOODS.find(n => n.slug === sp.hood)?.name;
  const category = CATEGORIES.find(c => c.slug === sp.category)?.slug;
  const { from, to } = dayRange(sp.day);

  let events = await getEvents({
    from, to,
    genre: sp.genre,
    tag: sp.tag,
    category: category as CategorySlug | undefined,
    indoor: sp.indoor === '1' ? true : sp.indoor === '0' ? false : undefined,
    neighborhood: hood,
    free: sp.free === '1',
    q: sp.q,
    limit: 200,
  });
  if (sp.featured === '1') events = events.filter(e => e.featured);

  const link = (params: Record<string, string | undefined>) => {
    const merged = { genre: sp.genre, hood: sp.hood, free: sp.free, day: sp.day, tag: sp.tag, q: sp.q, featured: sp.featured, category: sp.category, indoor: sp.indoor, ...params };
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
    return `/events${qs ? '?' + qs : ''}`;
  };

  return (
    <main>
      <section className="container">
        <div className="eyebrow">Event directory</div>
        <h1>All <em>events</em></h1>

        <form action="/events" method="get" style={{ display: 'flex', gap: 10, marginTop: 32, maxWidth: 560, flexWrap: 'wrap' }}>
          <input
            type="search" name="q" defaultValue={sp.q ?? ''}
            placeholder="Search artist, venue, promoter…"
            aria-label="Search events"
            style={{ flex: 1, minWidth: 220, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, padding: '13px 16px' }}
          />
          {sp.day && <input type="hidden" name="day" value={sp.day} />}
          {sp.genre && <input type="hidden" name="genre" value={sp.genre} />}
          <button className="btn btn-ghost" type="submit">Search</button>
        </form>

        <div className="filters" style={{ marginTop: 26 }}>
          <div className="flabel">When</div>
          {DAYS.map(d => (
            <Link key={d.v} className={`chip ${(sp.day ?? 'all') === d.v ? 'on' : ''}`} href={link({ day: d.v === 'all' ? undefined : d.v })}>
              {d.label}
            </Link>
          ))}

          <div className="flabel">Category</div>
          <Link className={`chip ${!sp.category ? 'on' : ''}`} href={link({ category: undefined, genre: undefined })}>All</Link>
          {CATEGORIES.map(c => (
            <Link key={c.slug} className={`chip ${sp.category === c.slug ? 'on' : ''}`} href={link({ category: sp.category === c.slug ? undefined : c.slug, genre: undefined })}>
              {c.name}
            </Link>
          ))}

          <div className="flabel">Picks</div>
          <Link className={`chip ${sp.featured === '1' ? 'on' : ''}`} href={link({ featured: sp.featured === '1' ? undefined : '1' })}>★ Featured picks</Link>
          <Link className={`chip ${sp.free === '1' ? 'on' : ''}`} href={link({ free: sp.free === '1' ? undefined : '1' })}>Free events</Link>
          <Link className={`chip ${sp.tag === 'warehouse' ? 'on' : ''}`} href={link({ tag: sp.tag === 'warehouse' ? undefined : 'warehouse' })}>Warehouse / underground</Link>
          <Link className={`chip ${sp.tag === 'afterhours' ? 'on' : ''}`} href={link({ tag: sp.tag === 'afterhours' ? undefined : 'afterhours' })}>Afterhours</Link>
          <Link className={`chip ${sp.tag === 'rooftop' ? 'on' : ''}`} href={link({ tag: sp.tag === 'rooftop' ? undefined : 'rooftop' })}>Rooftop</Link>

          <div className="flabel">Indoor / outdoor</div>
          <Link className={`chip ${!sp.indoor ? 'on' : ''}`} href={link({ indoor: undefined })}>All</Link>
          <Link className={`chip ${sp.indoor === '1' ? 'on' : ''}`} href={link({ indoor: sp.indoor === '1' ? undefined : '1' })}>Indoor</Link>
          <Link className={`chip ${sp.indoor === '0' ? 'on' : ''}`} href={link({ indoor: sp.indoor === '0' ? undefined : '0' })}>Outdoor</Link>

          {(!sp.category || sp.category === 'music') && (
            <>
              <div className="flabel">Genre</div>
              <Link className={`chip ${!sp.genre ? 'on' : ''}`} href={link({ genre: undefined })}>All</Link>
              {GENRES.map(g => (
                <Link key={g} className={`chip ${sp.genre === g ? 'on' : ''}`} href={link({ genre: g })}>{g}</Link>
              ))}
            </>
          )}

          <div className="flabel">Neighborhood</div>
          <Link className={`chip ${!sp.hood ? 'on' : ''}`} href={link({ hood: undefined })}>All</Link>
          {NEIGHBORHOODS.map(n => (
            <Link key={n.slug} className={`chip ${sp.hood === n.slug ? 'on' : ''}`} href={link({ hood: n.slug })}>{n.name}</Link>
          ))}
        </div>

        <div className="grid">
          {events.length
            ? events.map(e => <EventCard key={e.id} e={e} />)
            : <div className="empty">Nothing matches this direction — reset a filter or search differently.</div>}
        </div>
      </section>
      <SubscribeBand source="directory" />
    </main>
  );
}
