'use client';

import { useRef } from 'react';

export type DayNight = 'day' | 'night' | undefined;

const STOPS: DayNight[] = ['day', undefined, 'night'];
const STOP_LABEL: Record<string, string> = { day: 'Day', night: 'Night' };
const MAX_TILT_DEG = 34;

function stopIndex(value: DayNight) {
  return STOPS.indexOf(value);
}

/** A mechanical toggle switch — a chrome paddle mounted in a recessed slot
 * that physically pivots between Day, All (level) and Night. Purely
 * controlled: reacts only to a discrete press (click the zone you want,
 * or arrow/Home/End keys) — never to the cursor merely passing over it,
 * and never triggers navigation itself. */
export default function DayNightFader({
  value,
  onChange,
}: {
  value: DayNight;
  onChange: (next: DayNight) => void;
}) {
  const plateRef = useRef<HTMLDivElement>(null);
  const idx = stopIndex(value);
  const tiltDeg = (idx / 2 - 0.5) * (MAX_TILT_DEG * 2);

  function push(e: React.MouseEvent<HTMLDivElement>) {
    const plate = plateRef.current;
    if (!plate) return;
    const rect = plate.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const zone = frac < 1 / 3 ? 0 : frac < 2 / 3 ? 1 : 2;
    onChange(STOPS[zone]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); onChange(STOPS[Math.max(0, idx - 1)]); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); onChange(STOPS[Math.min(2, idx + 1)]); }
    else if (e.key === 'Home') { e.preventDefault(); onChange('day'); }
    else if (e.key === 'End') { e.preventDefault(); onChange('night'); }
  }

  return (
    <div className="dn-switch" aria-label="Filter by day or night">
      <span className="dn-switch-label">Day</span>
      <div className="dn-switch-plate" ref={plateRef} onClick={push}>
        <span className="dn-switch-screw dn-switch-screw-top" aria-hidden="true" />
        <div className="dn-switch-slot">
          <div
            className="dn-switch-toggle"
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={idx}
            aria-valuetext={STOP_LABEL[value ?? ''] ?? 'All'}
            style={{ transform: `rotateX(${tiltDeg}deg)` }}
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
