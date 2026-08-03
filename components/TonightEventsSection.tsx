'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import EventCard from './EventCard';
import DayNightFader, { type DayNight } from './DayNightFader';
import { isDaytime, isNighttime } from '@/lib/dayNight';
import { GENRES } from '@/lib/types';
import type { NocturnaEvent } from '@/lib/types';

/** The /tonight events grid — day/night filtering happens entirely in the
 * browser against the already-fetched event list, so flipping the switch
 * never triggers a navigation/refetch. Genre/price filtering stays
 * URL-driven (unaffected by this). */
export default function TonightEventsSection({
  events,
  genre,
  free,
  hood,
}: {
  events: NocturnaEvent[];
  genre?: string;
  free?: string;
  hood?: string;
}) {
  const [when, setWhen] = useState<DayNight>(undefined);

  const visible = useMemo(() => {
    if (!when) return events;
    return events.filter(e => (when === 'day' ? isDaytime(e.start_time) : isNighttime(e.start_time)));
  }, [events, when]);

  const link = (params: Record<string, string | undefined>) => {
    const merged = { genre, free, hood, ...params };
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
    return `/tonight${qs ? '?' + qs : ''}`;
  };

  return (
    <>
      <DayNightFader value={when} onChange={setWhen} />

      <div className="filters" style={{ marginTop: 36 }}>
        <div className="flabel">Genre</div>
        <Link className={`chip ${!genre ? 'on' : ''}`} href={link({ genre: undefined })}>All</Link>
        {GENRES.map(g => (
          <Link key={g} className={`chip ${genre === g ? 'on' : ''}`} href={link({ genre: g })}>
            {g}
          </Link>
        ))}
        <div className="flabel">Price</div>
        <Link className={`chip ${free !== '1' ? 'on' : ''}`} href={link({ free: undefined })}>Any</Link>
        <Link className={`chip ${free === '1' ? 'on' : ''}`} href={link({ free: '1' })}>Free</Link>
      </div>

      <div className="grid">
        {visible.length
          ? visible.map(e => <EventCard key={e.id} e={e} />)
          : <div className="empty">No verified events for tonight yet — the weekend guide is live.</div>}
      </div>
    </>
  );
}
