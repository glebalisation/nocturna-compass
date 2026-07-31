'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  bearingDeg,
  compassPoint,
  distanceMeters,
  formatDistance,
  shortestDelta,
} from '@/lib/compass-math';
import type { LocatedEvent } from '@/lib/types';

const CENTER = 150;
const R_OUTER = 140;
const R_TICK_MINOR = 122;
const R_TICK_MAJOR = 112;
const R_LABEL = 96;
const TICK_COUNT = 24; // every 15°

type Ranked = LocatedEvent & { dist: number; bearing: number };

function eventLink(e: LocatedEvent): { href: string; label: string } {
  if (e.ticket_url) return { href: e.ticket_url, label: 'Tickets ↗' };
  if (e.source_url?.includes('facebook.com')) return { href: e.source_url, label: 'Open on Facebook ↗' };
  if (e.source_url) return { href: e.source_url, label: 'Event source ↗' };
  return { href: `/events/${e.slug}`, label: 'Event details →' };
}

export default function CompassDial({ events }: { events: LocatedEvent[] }) {
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [rotorAngle, setRotorAngle] = useState(0);
  const [targetSlug, setTargetSlug] = useState<string | null>(null);
  const [hasLiveHeading, setHasLiveHeading] = useState(false);

  const rotorRef = useRef(0);
  const smoothedHeadingRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const ranked: Ranked[] = useMemo(() => {
    if (!coords) return [];
    return events
      .map((e) => ({
        ...e,
        dist: distanceMeters(coords.lat, coords.lon, e.lat, e.lng),
        bearing: bearingDeg(coords.lat, coords.lon, e.lat, e.lng),
      }))
      .sort((a, b) => a.dist - b.dist);
  }, [coords, events]);

  const target = ranked.find((r) => r.slug === targetSlug) ?? ranked[0] ?? null;

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  function onOrientation(e: DeviceOrientationEvent) {
    let raw: number | null = null;
    const webkitHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
    if (typeof webkitHeading === 'number') raw = webkitHeading;
    else if (e.alpha != null) raw = (360 - e.alpha) % 360;
    if (raw == null || Number.isNaN(raw)) return;

    setHasLiveHeading(true);
    if (smoothedHeadingRef.current == null) smoothedHeadingRef.current = raw;
    else smoothedHeadingRef.current += shortestDelta(raw, smoothedHeadingRef.current) * 0.15;

    const targetAngle = -smoothedHeadingRef.current;
    rotorRef.current += shortestDelta(targetAngle, rotorRef.current);
    setRotorAngle(rotorRef.current);
  }

  async function start() {
    setStatus('Locating you…');
    setStatusError(false);

    if (events.length === 0) {
      setStatus("No parties have coordinates yet — add lat/lng to events in Supabase (the Facebook collector fills these in automatically).");
      setStatusError(true);
      return;
    }

    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE?.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        if (result !== 'granted') setStatus('Motion access denied — showing bearing without a live needle.');
      } catch {
        setStatus('Motion access unavailable on this browser.');
      }
    }

    if (!navigator.geolocation) {
      setStatus("Geolocation isn't supported on this device.");
      setStatusError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStarted(true);
        setStatus('');
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
        const orientEvent = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
        window.addEventListener(orientEvent, onOrientation as EventListener, true);
      },
      () => {
        setStatus('Location access denied — enable it in your browser settings to find nearby parties.');
        setStatusError(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  if (!started) {
    return (
      <div className="compass-start">
        <button className="btn btn-primary" onClick={start}>Find the party</button>
        {status && <p className={`compass-status${statusError ? ' err' : ''}`}>{status}</p>}
      </div>
    );
  }

  if (!target) {
    return <p className="compass-status">No upcoming parties within range this week.</p>;
  }

  const link = eventLink(target);
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => (i * 360) / TICK_COUNT);
  const cardinals = [
    { deg: 0, label: 'N' },
    { deg: 90, label: 'E' },
    { deg: 180, label: 'S' },
    { deg: 270, label: 'W' },
  ];

  return (
    <div className="compass-wrap">
      <svg className="compass-dial" viewBox="0 0 300 300" role="img" aria-label="Compass pointing to the nearest party">
        <defs>
          <linearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#173D2B" />
            <stop offset="100%" stopColor="#2E6B4C" />
          </linearGradient>
        </defs>

        <circle className="compass-ring" cx={CENTER} cy={CENTER} r={R_OUTER} />
        <circle className="compass-ring" cx={CENTER} cy={CENTER} r={R_LABEL} />

        <g transform={`rotate(${rotorAngle.toFixed(2)} ${CENTER} ${CENTER})`}>
          {ticks.map((deg) => {
            const isCardinal = deg % 90 === 0;
            const isMajor = deg % 45 === 0;
            const rInner = isCardinal ? R_TICK_MAJOR - 10 : isMajor ? R_TICK_MAJOR : R_TICK_MINOR;
            const angle = ((deg - 90) * Math.PI) / 180;
            const x1 = CENTER + rInner * Math.cos(angle);
            const y1 = CENTER + rInner * Math.sin(angle);
            const x2 = CENTER + R_OUTER * Math.cos(angle);
            const y2 = CENTER + R_OUTER * Math.sin(angle);
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
            const x = CENTER + R_LABEL * Math.cos(angle);
            const y = CENTER + R_LABEL * Math.sin(angle);
            return (
              <text key={label} x={x} y={y} className={`compass-label${label === 'N' ? ' north' : ''}`}>
                {label}
              </text>
            );
          })}
        </g>

        <g id="compass-needle" transform={`rotate(${target.bearing.toFixed(2)} ${CENTER} ${CENTER})`}>
          <polygon className="compass-needle-tip" points="150,30 163,150 150,134 137,150" />
          <polygon className="compass-needle-tail" points="150,270 160,150 150,166 140,150" />
        </g>

        <circle className="compass-center-dot" cx={CENTER} cy={CENTER} r="5" />
      </svg>

      {!hasLiveHeading && (
        <p className="compass-status">
          No live compass sensor detected — pointing by true bearing: {compassPoint(target.bearing)} · {Math.round(target.bearing)}°
        </p>
      )}

      <div className="compass-readout">
        <div className="compass-party-name">{target.title}</div>
        <div className="compass-party-meta">
          <strong>{formatDistance(target.dist)}</strong> · {compassPoint(target.bearing)} · {target.venue_name ?? target.neighborhood ?? 'TBA'}
        </div>
        <div className="compass-links">
          <Link href={`/events/${target.slug}`} className="compass-link">Details →</Link>
          {link.href !== `/events/${target.slug}` && (
            <a href={link.href} target="_blank" rel="noopener" className="compass-link">{link.label}</a>
          )}
        </div>
      </div>

      {ranked.length > 1 && (
        <nav className="compass-list" aria-label="All parties by distance">
          {ranked.slice(0, 8).map((r) => (
            <button
              key={r.slug}
              className={`chip${r.slug === target.slug ? ' on' : ''}`}
              onClick={() => setTargetSlug(r.slug)}
            >
              {r.title} · {formatDistance(r.dist)}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
