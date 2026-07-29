'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  LA_CENTER,
  bearingDeg,
  compassPoint,
  distanceMeters,
  formatDistance,
  shortestDelta,
} from '@/lib/compass-math';
import { hasCoords, type NocturnaEvent } from '@/lib/types';

const CENTER = 150;
const R_OUTER = 140;
const R_TICK_MINOR = 122;
const R_TICK_MAJOR = 112;
const R_LABEL = 96;
const R_MARK = R_TICK_MAJOR - 10;
const TICK_COUNT = 24; // every 15°
const MAX_EVENTS = 8;
const REVEAL_THRESHOLD = 26; // degrees of cursor slack before a pop-up hides

/** Round trig output before it hits JSX — server/client V8 builds can differ in the last float bit, which fails hydration. */
const r3 = (n: number) => Math.round(n * 1000) / 1000;

type Placed = { event: NocturnaEvent; angle: number; located: boolean };

/** Real bearing from a fixed LA reference point when we have coordinates; otherwise spread evenly into whatever gaps are left. */
function assignAngles(events: NocturnaEvent[]): Placed[] {
  const located: Placed[] = events
    .filter(hasCoords)
    .slice(0, MAX_EVENTS)
    .map((event) => ({
      event,
      angle: bearingDeg(LA_CENTER.lat, LA_CENTER.lon, event.lat, event.lng),
      located: true,
    }));

  const remainingSlots = MAX_EVENTS - located.length;
  const rest = events.filter((e) => !hasCoords(e)).slice(0, Math.max(0, remainingSlots));

  const angles = located.map((p) => p.angle).sort((a, b) => a - b);
  const placedRest: Placed[] = [];

  for (const event of rest) {
    let mid = 0;
    if (angles.length === 0) {
      mid = (placedRest.length * 360) / rest.length;
    } else {
      let bestSize = -1;
      const n = angles.length;
      for (let i = 0; i < n; i++) {
        const a = angles[i];
        const b = (i === n - 1 ? angles[0] + 360 : angles[i + 1]);
        const size = b - a;
        if (size > bestSize) { bestSize = size; mid = (a + b) / 2; }
      }
      mid = ((mid % 360) + 360) % 360;
    }
    placedRest.push({ event, angle: mid, located: false });
    angles.push(mid);
    angles.sort((a, b) => a - b);
  }

  return [...located, ...placedRest].sort((a, b) => a.angle - b.angle);
}

export default function HomeCompass({ events }: { events: NocturnaEvent[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef(0);
  const [rotorAngle, setRotorAngle] = useState(0);
  const [mouseAngle, setMouseAngle] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);

  const placed = useMemo(() => assignAngles(events), [events]);

  function retarget(deg: number) {
    rotorRef.current += shortestDelta(deg, rotorRef.current);
    setRotorAngle(rotorRef.current);
  }

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
    setMouseAngle(deg);
    retarget(deg);
    setHovering(true);
  }

  function onLeave() {
    setHovering(false);
    setMouseAngle(null);
    retarget(0);
  }

  const active = useMemo(() => {
    if (!hovering || mouseAngle == null) return null;
    let best: Placed | null = null;
    let bestDelta = Infinity;
    for (const p of placed) {
      const d = Math.abs(shortestDelta(p.angle, mouseAngle));
      if (d < REVEAL_THRESHOLD && d < bestDelta) { best = p; bestDelta = d; }
    }
    return best;
  }, [hovering, mouseAngle, placed]);

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => (i * 360) / TICK_COUNT);
  const cardinals = [
    { deg: 0, label: 'N' },
    { deg: 90, label: 'E' },
    { deg: 180, label: 'S' },
    { deg: 270, label: 'W' },
  ];

  return (
    <div className="home-compass" ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave}>
      <svg className="home-compass-dial" viewBox="0 0 300 300" role="img" aria-label="Interactive compass of tonight's events">
        <defs>
          <linearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A1D20" />
            <stop offset="100%" stopColor="#B7BBC0" />
          </linearGradient>
        </defs>

        <circle className="compass-ring" cx={CENTER} cy={CENTER} r={R_OUTER} />
        <circle className="compass-ring" cx={CENTER} cy={CENTER} r={R_LABEL} />

        {ticks.map((deg) => {
          const isCardinal = deg % 90 === 0;
          const isMajor = deg % 45 === 0;
          const rInner = isCardinal ? R_TICK_MAJOR - 10 : isMajor ? R_TICK_MAJOR : R_TICK_MINOR;
          const angle = ((deg - 90) * Math.PI) / 180;
          const x1 = r3(CENTER + rInner * Math.cos(angle));
          const y1 = r3(CENTER + rInner * Math.sin(angle));
          const x2 = r3(CENTER + R_OUTER * Math.cos(angle));
          const y2 = r3(CENTER + R_OUTER * Math.sin(angle));
          return (
            <line
              key={deg}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className={`compass-tick${isCardinal ? ' cardinal' : isMajor ? ' major' : ''}`}
            />
          );
        })}
        {cardinals.map(({ deg, label }) => {
          const angle = ((deg - 90) * Math.PI) / 180;
          const x = r3(CENTER + R_LABEL * Math.cos(angle));
          const y = r3(CENTER + R_LABEL * Math.sin(angle));
          return (
            <text key={label} x={x} y={y} className={`compass-label${label === 'N' ? ' north' : ''}`}>
              {label}
            </text>
          );
        })}

        {placed.map((p) => {
          const angle = ((p.angle - 90) * Math.PI) / 180;
          const x = r3(CENTER + R_MARK * Math.cos(angle));
          const y = r3(CENTER + R_MARK * Math.sin(angle));
          const isActive = active?.event.id === p.event.id;
          return (
            <circle
              key={p.event.id}
              cx={x} cy={y}
              r={isActive ? 4.5 : 2.6}
              className={`home-compass-mark${isActive ? ' active' : ''}`}
            />
          );
        })}

        <g className="home-compass-needle" transform={`rotate(${rotorAngle.toFixed(2)} ${CENTER} ${CENTER})`}>
          <polygon className="compass-needle-tip" points="150,36 160,150 150,138 140,150" />
          <polygon className="compass-needle-tail" points="150,264 158,150 150,160 142,150" />
        </g>

        <circle className="compass-center-dot" cx={CENTER} cy={CENTER} r="5" />
      </svg>

      {placed.map((p) => {
        const isActive = active?.event.id === p.event.id;
        const rad = ((p.angle - 90) * Math.PI) / 180;
        const left = r3(50 + 45 * Math.cos(rad));
        const top = r3(50 + 45 * Math.sin(rad));
        const dist = p.located && hasCoords(p.event)
          ? formatDistance(distanceMeters(LA_CENTER.lat, LA_CENTER.lon, p.event.lat, p.event.lng))
          : null;
        return (
          <Link
            key={p.event.id}
            href={`/events/${p.event.slug}`}
            className={`home-compass-pop${isActive ? ' visible' : ''}`}
            style={{ left: `${left}%`, top: `${top}%` }}
            tabIndex={isActive ? 0 : -1}
            aria-hidden={!isActive}
          >
            <span className="home-compass-pop-dir">{compassPoint(p.angle)}{dist ? ` · ${dist}` : ''}</span>
            <b>{p.event.title}</b>
            <span className="home-compass-pop-venue">{p.event.venue_name ?? p.event.neighborhood ?? 'Location revealed soon'}</span>
          </Link>
        );
      })}

      <div className="home-compass-hint">{hovering ? 'Circle the dial' : 'Move your cursor over the compass'}</div>
    </div>
  );
}
