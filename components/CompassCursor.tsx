'use client';

import { useEffect, useRef } from 'react';

type CursorState = 'default' | 'link' | 'drag' | 'audio';

const DRAG_SELECTOR = '.media-ribbon, .dn-switch-plate, .dn-switch-toggle, .sticky-player-progress';
const AUDIO_SELECTOR = '.media-card-button, .sticky-player-playpause, .sticky-player-mute';
const LINK_SELECTOR = 'a, button, [role="button"], input[type="range"], select, .chip';

export default function CompassCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const last = useRef({ x: 0, y: 0 });
  const angle = useRef(0);
  const state = useRef<CursorState>('default');

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('has-compass-cursor');

    function setState(next: CursorState) {
      if (state.current === next) return;
      state.current = next;
      dotRef.current?.setAttribute('data-state', next);
    }

    function onMove(e: PointerEvent) {
      const el = dotRef.current;
      if (!el) return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

      if (!reducedMotion) {
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        if (dx * dx + dy * dy > 4) {
          angle.current = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          if (needleRef.current) needleRef.current.style.transform = `rotate(${angle.current}deg)`;
        }
      }
      last.current = { x: e.clientX, y: e.clientY };

      // Most-specific-first: a playable card sits inside the draggable ribbon,
      // so audio/link targets must win over their draggable container.
      const target = e.target as Element | null;
      if (target?.closest(AUDIO_SELECTOR)) setState('audio');
      else if (target?.closest(LINK_SELECTOR)) setState('link');
      else if (target?.closest(DRAG_SELECTOR)) setState('drag');
      else setState('default');
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.documentElement.classList.remove('has-compass-cursor');
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div className="compass-cursor" ref={dotRef} data-state="default" aria-hidden="true">
      <div className="compass-cursor-ring" />
      <div className="compass-cursor-needle" ref={needleRef} />
      <div className="compass-cursor-drag" />
      <div className="compass-cursor-audio" />
    </div>
  );
}
