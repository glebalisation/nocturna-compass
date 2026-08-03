'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useCompassHover } from './HomeCompassHover';

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

// Spring constants tuned for a fast snap with one visible mechanical overshoot,
// settling in ~1s. See lib/compass-math for the shared angle helpers.
const SPRING_STIFFNESS = 130;
const SPRING_DAMPING = 13;
const TENSION_KICK = 40; // small counter-impulse before the snap, for a "wind-up" feel
const SETTLE_ANGLE_EPS = 0.4;
const SETTLE_VELOCITY_EPS = 1.2;

export default function HomeCompass({ events }: { events: NocturnaEvent[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const [rotorAngle, setRotorAngle] = useState(0);
  const [mouseAngle, setMouseAngle] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const wasSettledRef = useRef(true);

  const placed = useMemo(() => assignAngles(events), [events]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

  function tick(now: number) {
    const last = lastFrameRef.current ?? now;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    lastFrameRef.current = now;

    const accel = SPRING_STIFFNESS * (targetRef.current - angleRef.current) - SPRING_DAMPING * velocityRef.current;
    velocityRef.current += accel * dt;
    angleRef.current += velocityRef.current * dt;
    setRotorAngle(angleRef.current);

    const settled =
      Math.abs(targetRef.current - angleRef.current) < SETTLE_ANGLE_EPS &&
      Math.abs(velocityRef.current) < SETTLE_VELOCITY_EPS;

    if (settled) {
      angleRef.current = targetRef.current;
      velocityRef.current = 0;
      setRotorAngle(angleRef.current);
      lastFrameRef.current = null;
      rafRef.current = null;
      if (!wasSettledRef.current) {
        // Mechanical snap just completed — pulse the guide it landed on.
        wasSettledRef.current = true;
      }
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function retarget(deg: number) {
    const delta = shortestDelta(deg, targetRef.current);
    if (Math.abs(delta) < 0.5) return;

    const wasIdle = rafRef.current == null;
    targetRef.current += delta;
    if (wasIdle) {
      // Tension: a brief counter-impulse before the spring snaps forward.
      velocityRef.current -= Math.sign(delta || 1) * TENSION_KICK;
    }
    wasSettledRef.current = false;
    if (reducedMotionRef.current) {
      angleRef.current = targetRef.current;
      velocityRef.current = 0;
      setRotorAngle(angleRef.current);
      return;
    }
    if (rafRef.current == null) {
      lastFrameRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
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

  // Hovering an event card elsewhere on the page (a sibling, not a child)
  // points the needle at it too — but only when the user isn't already
  // directly steering the dial with their mouse, which always wins.
  const { hoverAngle } = useCompassHover();
  useEffect(() => {
    if (hovering) return;
    retarget(hoverAngle ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverAngle, hovering]);

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

  // Pulse the active mark once the needle mechanically settles onto it.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      setPulseId(active.event.id);
      const clear = setTimeout(() => setPulseId(null), 480);
      return () => clearTimeout(clear);
    }, 420);
    return () => clearTimeout(t);
  }, [active]);

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
          <radialGradient id="plateGrad" cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#2A2E32" />
            <stop offset="55%" stopColor="#14171A" />
            <stop offset="100%" stopColor="#05070B" />
          </radialGradient>
          <linearGradient id="chromeRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F4F3EE" />
            <stop offset="20%" stopColor="#84888A" />
            <stop offset="42%" stopColor="#EDEEEC" />
            <stop offset="58%" stopColor="#4A4E51" />
            <stop offset="78%" stopColor="#C7C9C7" />
            <stop offset="100%" stopColor="#EDEEEC" />
          </linearGradient>
          <linearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F3D25" />
            <stop offset="50%" stopColor="#1C5C3B" />
            <stop offset="100%" stopColor="#0A2617" />
          </linearGradient>
        </defs>

        <circle className="compass-plate" cx={CENTER} cy={CENTER} r={R_OUTER + 8} />
        <circle className="compass-ring-heavy" cx={CENTER} cy={CENTER} r={R_OUTER} />
        <circle className="compass-ring-heavy inner" cx={CENTER} cy={CENTER} r={R_OUTER - 14} />
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
          const isPulsing = pulseId === p.event.id;
          return (
            <circle
              key={p.event.id}
              cx={x} cy={y}
              r={isActive ? 4.5 : 2.6}
              className={`home-compass-mark${isActive ? ' active' : ''}${isPulsing ? ' pulsing' : ''}`}
            />
          );
        })}

        <g className="home-compass-needle" transform={`rotate(${rotorAngle.toFixed(2)} ${CENTER} ${CENTER})`}>
          <polygon className="compass-needle" points="150,22 163,150 150,180 137,150" />
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
