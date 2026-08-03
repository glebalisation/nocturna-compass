'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type DayNight = 'day' | 'night' | undefined;

const STOPS: DayNight[] = ['day', undefined, 'night'];
const STOP_LABEL: Record<string, string> = { day: 'Day', night: 'Night' };
const MAX_TILT_DEG = 34;

function stopIndex(value: DayNight) {
  return STOPS.indexOf(value);
}

/** A mechanical toggle switch — a chrome paddle mounted in a recessed slot
 * that physically pivots (real 3D CSS: perspective + rotateX) between Day,
 * All (level) and Night, rather than sliding along a track. */
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
  const tiltDeg = (frac - 0.5) * (MAX_TILT_DEG * 2);

  function hrefFor(when: DayNight) {
    const merged = { ...params, when };
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
    return `${basePath}${qs ? '?' + qs : ''}`;
  }

  function fracFromClientY(clientY: number) {
    const rail = railRef.current;
    if (!rail) return restingFrac;
    const rect = rail.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  }

  function commit(f: number) {
    const idx = Math.round(f * 2); // 0, 1, 2
    router.push(hrefFor(STOPS[idx]));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    setDragFrac(fracFromClientY(e.clientY));
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setDragFrac(fracFromClientY(e.clientY));
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const f = fracFromClientY(e.clientY);
    setDragFrac(null);
    commit(f);
  }

  function onRailClick(e: React.MouseEvent<HTMLDivElement>) {
    if (draggingRef.current) return;
    commit(fracFromClientY(e.clientY));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const idx = stopIndex(value);
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); router.push(hrefFor(STOPS[Math.max(0, idx - 1)])); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); router.push(hrefFor(STOPS[Math.min(2, idx + 1)])); }
    else if (e.key === 'Home') { e.preventDefault(); router.push(hrefFor('day')); }
    else if (e.key === 'End') { e.preventDefault(); router.push(hrefFor('night')); }
  }

  return (
    <div className="dn-switch" aria-label="Filter by day or night">
      <span className="dn-switch-label">Day</span>
      <div
        className="dn-switch-plate"
        ref={railRef}
        onClick={onRailClick}
        onPointerMove={onPointerMove}
      >
        <span className="dn-switch-screw dn-switch-screw-top" aria-hidden="true" />
        <div className="dn-switch-slot">
          <div
            className={`dn-switch-toggle${dragFrac != null ? ' dragging' : ''}`}
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={stopIndex(value)}
            aria-valuetext={STOP_LABEL[value ?? ''] ?? 'All'}
            style={{ transform: `rotateX(${tiltDeg}deg)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={onKeyDown}
          >
            <span className="dn-switch-toggle-cap" />
          </div>
        </div>
        <span className="dn-switch-screw dn-switch-screw-bottom" aria-hidden="true" />
      </div>
      <span className="dn-switch-label">Night</span>
    </div>
  );
}
