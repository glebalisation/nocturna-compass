'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A barely-visible abstract cartographic texture behind the homepage compass —
 * coastline, freeway-like lines and a coordinate dot-grid. Not a real map:
 * decorative only, so it stays legible under the compass and never reads as
 * a functional navigation surface.
 */
export default function LAMapBackground() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion.current) return;
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width - 0.5;
    const fy = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: fx * -8, y: fy * -8 });
  }

  function onLeave() {
    setOffset({ x: 0, y: 0 });
  }

  const dots = [];
  for (let x = 0; x <= 5; x++) {
    for (let y = 0; y <= 5; y++) {
      dots.push({ cx: 20 + x * 72, cy: 20 + y * 72 });
    }
  }

  return (
    <div
      className="la-map-bg"
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 400"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {/* coordinate dot-grid */}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={1.2} className="la-map-dot" />
        ))}

        {/* freeway-like diagonals */}
        <line x1="-20" y1="120" x2="420" y2="260" className="la-map-line" />
        <line x1="-20" y1="300" x2="420" y2="90" className="la-map-line" />
        <line x1="140" y1="-20" x2="260" y2="420" className="la-map-line" />
        <line x1="60" y1="-20" x2="340" y2="420" className="la-map-line" />

        {/* coastline */}
        <path
          d="M -20 260 C 60 250, 90 300, 140 320 S 240 300, 280 340 S 360 380, 420 360"
          className="la-map-coast"
        />

        {/* district markers */}
        <circle cx="200" cy="180" r="3" className="la-map-mark" />
        <circle cx="150" cy="140" r="2.4" className="la-map-mark" />
        <circle cx="250" cy="150" r="2.4" className="la-map-mark" />
        <circle cx="190" cy="240" r="2.4" className="la-map-mark" />
        <circle cx="110" cy="280" r="2.4" className="la-map-mark" />

        <text x="205" y="176" className="la-map-label">DTLA</text>
        <text x="112" y="136" className="la-map-label">WEHO</text>
        <text x="255" y="146" className="la-map-label">HWD</text>
        <text x="195" y="256" className="la-map-label">ECHO PK</text>
        <text x="60" y="296" className="la-map-label">VENICE</text>
      </svg>
    </div>
  );
}
