'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function displayHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}${suffix}`;
}

export default function HourFader({
  basePath,
  hour,
  params = {},
}: {
  basePath: string;
  /** Minimum start hour to show, 0-23; undefined/0 means "no filter". */
  hour?: number;
  params?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const railRef = useRef<HTMLDivElement>(null);
  const [dragFrac, setDragFrac] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const value = hour ?? 0;
  const restingFrac = value / 23;
  const frac = dragFrac ?? restingFrac;

  function hrefFor(h: number) {
    const merged = { ...params, hour: h > 0 ? String(h) : undefined };
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
    router.push(hrefFor(Math.round(f * 23)));
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
    if (e.key === 'ArrowLeft') { e.preventDefault(); router.push(hrefFor(Math.max(0, value - 1))); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); router.push(hrefFor(Math.min(23, value + 1))); }
    else if (e.key === 'Home') { e.preventDefault(); router.push(hrefFor(0)); }
    else if (e.key === 'End') { e.preventDefault(); router.push(hrefFor(23)); }
  }

  const ticks = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="hour-fader">
      <div className="hour-fader-readout">
        <span>{value > 0 ? `Starting from` : 'Any start time'}</span>
        {value > 0 && <strong>{displayHour(value)}</strong>}
      </div>
      <div
        className="hour-fader-rail"
        ref={railRef}
        onClick={onRailClick}
        onPointerMove={onPointerMove}
      >
        <div className="hour-fader-track" />
        <div
          className={`hour-fader-cap${dragFrac != null ? ' dragging' : ''}`}
          role="slider"
          tabIndex={0}
          aria-label="Filter events by start hour"
          aria-valuemin={0}
          aria-valuemax={23}
          aria-valuenow={value}
          aria-valuetext={value > 0 ? displayHour(value) : 'Any time'}
          style={{ left: `${frac * 100}%` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="hour-fader-ruler" aria-hidden="true">
        {ticks.map((h) => (
          <span key={h} className={h % 3 === 0 ? 'major' : ''}>{h % 3 === 0 ? displayHour(h) : ''}</span>
        ))}
      </div>
    </div>
  );
}
