'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type DayNight = 'day' | 'night' | undefined;

const STOPS: DayNight[] = ['day', undefined, 'night'];
const STOP_LABEL: Record<string, string> = { day: 'Day', night: 'Night' };

function stopIndex(value: DayNight) {
  return STOPS.indexOf(value);
}

export default function DayNightFader({
  basePath,
  value,
  params = {},
}: {
  basePath: string;
  value: DayNight;
  /** Other current query params to preserve (excluding `when`) — plain data, not a callback, so this stays serializable across the server/client boundary. */
  params?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const railRef = useRef<HTMLDivElement>(null);
  const [dragFrac, setDragFrac] = useState<number | null>(null); // 0..1 while actively dragging
  const draggingRef = useRef(false);

  const restingFrac = stopIndex(value) / 2;
  const frac = dragFrac ?? restingFrac;

  function hrefFor(when: DayNight) {
    const merged = { ...params, when };
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
    return `${basePath}${qs ? '?' + qs : ''}`;
  }

  function fracFromClientX(clientX: number) {
    const rail = railRef.current;
    if (!rail) return restingFrac;
    const rect = rail.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  function commit(f: number) {
    const idx = Math.round(f * 2); // 0, 1, 2
    router.push(hrefFor(STOPS[idx]));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    setDragFrac(fracFromClientX(e.clientX));
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setDragFrac(fracFromClientX(e.clientX));
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const f = fracFromClientX(e.clientX);
    setDragFrac(null);
    commit(f);
  }

  function onRailClick(e: React.MouseEvent<HTMLDivElement>) {
    if (draggingRef.current) return;
    commit(fracFromClientX(e.clientX));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const idx = stopIndex(value);
    if (e.key === 'ArrowLeft') { e.preventDefault(); router.push(hrefFor(STOPS[Math.max(0, idx - 1)])); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); router.push(hrefFor(STOPS[Math.min(2, idx + 1)])); }
    else if (e.key === 'Home') { e.preventDefault(); router.push(hrefFor('day')); }
    else if (e.key === 'End') { e.preventDefault(); router.push(hrefFor('night')); }
  }

  return (
    <div className="hw-fader" aria-label="Filter by day or night">
      <span className="hw-fader-label hw-fader-label-day">Day</span>
      <div
        className="hw-fader-rail"
        ref={railRef}
        onClick={onRailClick}
        onPointerMove={onPointerMove}
      >
        <div className="hw-fader-track" />
        <div
          className={`hw-fader-cap${dragFrac != null ? ' dragging' : ''}`}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={2}
          aria-valuenow={stopIndex(value)}
          aria-valuetext={STOP_LABEL[value ?? ''] ?? 'All'}
          style={{ left: `${frac * 100}%` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        />
      </div>
      <span className="hw-fader-label hw-fader-label-night">Night</span>
    </div>
  );
}
