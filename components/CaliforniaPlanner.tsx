'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { NocturnaEvent } from '@/lib/types';

type Mode = 'night' | 'day';

const DAY_DISCOVERY: NocturnaEvent[] = [
  { id: 'ca-day-1', slug: 'sunday-service', title: 'Sunday Service', date: '', start_time: '12:00', end_time: '18:00', venue_name: 'The Rose Room', neighborhood: 'Venice', genres: ['house'], lineup: ['Pacific Standard', 'Guests'], price: 'Free RSVP', status: 'approved', source: 'editorial' },
  { id: 'ca-day-2', slug: 'desert-pool-radio', title: 'Desert Pool Radio', date: '', start_time: '14:00', end_time: '21:00', venue_name: 'Palm Springs', neighborhood: 'Coachella Valley', genres: ['house', 'minimal'], lineup: ['Nocturna Selectors'], price: '$20', status: 'approved', source: 'editorial' },
  { id: 'ca-day-3', slug: 'golden-hour-sessions', title: 'Golden Hour Sessions', date: '', start_time: '16:00', end_time: '22:00', venue_name: 'The Roof', neighborhood: 'Downtown LA', genres: ['melodic'], lineup: ['Ama Diallo', 'Soft Static'], price: '$18', status: 'approved', source: 'editorial' },
];

function hourOf(event: NocturnaEvent) {
  return Number(event.start_time?.slice(0, 2) ?? 20);
}

function timelineHour(index: number) {
  return (index + 10) % 24;
}

function displayHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:00 ${suffix}`;
}

export default function CaliforniaPlanner({ events }: { events: NocturnaEvent[] }) {
  const [mode, setMode] = useState<Mode>('night');
  const [timeIndex, setTimeIndex] = useState(10);
  const startHour = timelineHour(timeIndex);

  const visible = useMemo(() => {
    const source = mode === 'day' ? [...DAY_DISCOVERY, ...events] : events;
    const byMode = source.filter(event => {
      const hour = hourOf(event);
      return mode === 'day' ? hour >= 8 && hour < 20 : hour >= 20 || hour < 8;
    });
    const afterStart = byMode.filter(event => {
      const hour = hourOf(event);
      if (mode === 'day') return hour >= startHour;
      const normalized = hour < 8 ? hour + 24 : hour;
      const normalizedStart = startHour < 8 ? startHour + 24 : startHour;
      return normalized >= normalizedStart;
    });
    return afterStart.length ? afterStart : byMode;
  }, [events, mode, startHour]);

  const tape = visible.length ? [...visible, ...visible] : [];

  return (
    <section className={`ca-planner ${mode}`}>
      <div className="planner-topline">
        <div>
          <div className="eyebrow">California · Launch region 01</div>
          <h1>Choose your <em>time.</em><br />Follow the night.</h1>
        </div>
        <div className="day-night-toggle" role="group" aria-label="Event mode">
          <button type="button" className={mode === 'night' ? 'active' : ''} onClick={() => { setMode('night'); setTimeIndex(10); }}>
            <span>●</span> Nightlife
          </button>
          <button type="button" className={mode === 'day' ? 'active' : ''} onClick={() => { setMode('day'); setTimeIndex(2); }}>
            <span>☀</span> Day parties
          </button>
        </div>
      </div>

      <p className="planner-intro">
        Set the hour you want to begin. The Compass lines up the California rooms,
        rooftops, day clubs and afterhours that fit your route.
      </p>

      <div className="time-planner">
        <div className="time-readout">
          <span>Your night starts</span>
          <strong>{displayHour(startHour)}</strong>
        </div>
        <input
          className="time-range"
          type="range"
          min="0"
          max="23"
          step="1"
          value={timeIndex}
          aria-label="Choose a start time"
          onChange={event => setTimeIndex(Number(event.target.value))}
        />
        <div className="time-ruler" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => {
            const hour = timelineHour(index);
            return <span key={hour} className={index % 3 === 0 ? 'major' : ''}>{index % 3 === 0 ? displayHour(hour).replace(':00 ', '') : ''}</span>;
          })}
        </div>
      </div>

      <div className="tape-label">
        <span>Now entering the Compass</span>
        <span>{visible.length} matches after {displayHour(startHour)}</span>
      </div>

      <div className="event-tape" aria-label={`${mode === 'night' ? 'Nightlife' : 'Day party'} events`}>
        <div className="event-tape-track">
          {tape.map((event, index) => (
            <Link href={event.source === 'editorial' ? '/events?day=weekend' : `/events/${event.slug}`} className="tape-card" key={`${event.id}-${index}`}>
              <div className="tape-time">{event.start_time ?? 'TBA'}</div>
              <div>
                <small>{event.neighborhood ?? 'California'} · {event.genres.join(' / ')}</small>
                <h2>{event.title}</h2>
                <p>{event.venue_name ?? 'Location revealed to members'}</p>
              </div>
              <span className="tape-arrow">↗</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="planner-foot">
        <span>Scroll the tape or move the timeline to re-plan</span>
        <span>California first · More regions soon</span>
      </div>
    </section>
  );
}
