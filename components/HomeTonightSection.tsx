'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import EventCard from './EventCard';
import EventHoverTarget from './EventHoverTarget';
import DayNightFader, { type DayNight } from './DayNightFader';
import { isDaytime, isNighttime } from '@/lib/dayNight';
import { CATEGORIES } from '@/lib/types';
import type { NocturnaEvent } from '@/lib/types';

/** The homepage "Tonight" grid — day/night filtering happens entirely in
 * the browser against the already-fetched event list, so flipping the
 * switch never triggers a navigation/refetch. Category filtering stays
 * URL-driven (unaffected by this). */
export default function HomeTonightSection({
  events,
  hood,
  category,
}: {
  events: NocturnaEvent[];
  hood?: string;
  category?: string;
}) {
  const [when, setWhen] = useState<DayNight>(undefined);

  const visible = useMemo(() => {
    if (!when) return events;
    return events.filter(e => (when === 'day' ? isDaytime(e.start_time) : isNighttime(e.start_time)));
  }, [events, when]);

  const link = (params: Record<string, string | undefined>) => {
    const merged = { hood, category, ...params };
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
    return `/${qs ? '?' + qs : ''}`;
  };

  return (
    <>
      <DayNightFader value={when} onChange={setWhen} />

      <div className="filters" style={{ marginTop: 18 }}>
        <Link className={`chip ${!category ? 'on' : ''}`} href={link({ category: undefined })}>All</Link>
        {CATEGORIES.map(c => (
          <Link key={c.slug} className={`chip ${category === c.slug ? 'on' : ''}`} href={link({ category: category === c.slug ? undefined : c.slug })}>
            {c.name}
          </Link>
        ))}
      </div>

      <div className="grid" style={{ marginTop: 26 }}>
        {visible.length
          ? visible.map(e => (
            <EventHoverTarget key={e.id} event={e}>
              <EventCard e={e} />
            </EventHoverTarget>
          ))
          : <div className="empty">Tonight is quiet — check the weekend guide.</div>}
      </div>
    </>
  );
}
