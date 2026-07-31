'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { KIND_ICON, KIND_LABEL, type MediaItem } from '@/lib/media';
import { usePlayer } from './PlayerProvider';

const SPEED_PX_PER_SEC = 22; // slow, ambient — an editorial layer, not a marquee

function Card({ item }: { item: MediaItem }) {
  const { play } = usePlayer();
  const inner = (
    <>
      <div className="media-card-visual" data-kind={item.kind}>
        <span className="media-card-icon" aria-hidden="true">{KIND_ICON[item.kind]}</span>
        <span className="tag">{KIND_LABEL[item.kind]}</span>
      </div>
      <div className="media-card-body">
        <h3>{item.title}</h3>
        <div className="media-card-meta">
          <span>{item.meta}</span>
          <span>{item.duration}</span>
        </div>
        <div className="media-card-source">
          {item.source}
          {(item.href || item.track) && (
            <span className="media-card-go" aria-hidden="true">
              {item.track ? 'Play →' : item.kind === 'article' || item.kind === 'recap' || item.kind === 'interview' ? 'Read →' : 'Open →'}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (item.track) {
    return (
      <button type="button" className="media-card media-card-button" onClick={() => play(item.track!)} draggable={false}>
        {inner}
      </button>
    );
  }

  return item.href
    ? <Link href={item.href} className="media-card" draggable={false}>{inner}</Link>
    : <article className="media-card media-card-static" aria-label={`${KIND_LABEL[item.kind]}: ${item.title} (coming soon)`}>{inner}</article>;
}

export default function MediaRibbon({ items }: { items: MediaItem[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  // The running scroll position as a float, independent of the DOM's rounded
  // scrollLeft — writing/reading scrollLeft every frame loses the sub-pixel
  // remainder each time, so a per-frame `scrollLeft += smallAmount` never
  // actually accumulates. This ref is the source of truth instead.
  const posRef = useRef(0);
  const lastProgrammaticAtRef = useRef(0);
  const pointerDownRef = useRef<{ x: number; scrollLeft: number; pointerId: number } | null>(null);
  const DRAG_THRESHOLD = 6; // px of movement before a pointerdown counts as a drag, not a click

  const looped = [...items, ...items];

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rail = railRef.current;
    if (!rail || reducedMotionRef.current) return;
    posRef.current = rail.scrollLeft;

    function tick(now: number) {
      const last = lastRef.current ?? now;
      const dt = Math.min((now - last) / 1000, 1 / 20);
      lastRef.current = now;
      const el = railRef.current;
      if (el && !pausedRef.current && !draggingRef.current) {
        posRef.current += SPEED_PX_PER_SEC * dt;
        const half = el.scrollWidth / 2;
        if (posRef.current >= half) posRef.current -= half;
        el.scrollLeft = posRef.current;
        lastProgrammaticAtRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, []);

  function pause() { pausedRef.current = true; }
  function resume() { pausedRef.current = false; }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = railRef.current;
    if (!el) return;
    // Don't engage drag (or capture the pointer) yet — a plain click on a card
    // must reach it as a normal click. Only pointermove past the threshold
    // turns this into a drag.
    pointerDownRef.current = { x: e.clientX, scrollLeft: el.scrollLeft, pointerId: e.pointerId };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = railRef.current;
    if (!el) return;
    if (draggingRef.current) {
      el.scrollLeft = dragStartRef.current.scrollLeft - (e.clientX - dragStartRef.current.x);
      return;
    }
    const down = pointerDownRef.current;
    if (!down || Math.abs(e.clientX - down.x) < DRAG_THRESHOLD) return;
    draggingRef.current = true;
    dragStartRef.current = { x: down.x, scrollLeft: down.scrollLeft };
    el.setPointerCapture?.(down.pointerId);
    el.scrollLeft = dragStartRef.current.scrollLeft - (e.clientX - dragStartRef.current.x);
  }
  function onPointerUp() {
    pointerDownRef.current = null;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (railRef.current) posRef.current = railRef.current.scrollLeft;
  }
  // Native trackpad/touch scrolling bypasses our pointer handlers entirely —
  // keep posRef in sync so the auto-scroll resumes from wherever that left off.
  // Scroll events also fire from our own rAF writes, so ignore any scroll that
  // lands right after one of those (rather than resync posRef from the DOM's
  // rounded value, which is the same precision-loss bug the rAF loop avoids).
  function onScroll() {
    if (draggingRef.current || !railRef.current) return;
    if (performance.now() - lastProgrammaticAtRef.current < 100) return;
    posRef.current = railRef.current.scrollLeft;
  }

  return (
    <div
      className="media-ribbon"
      ref={railRef}
      onMouseEnter={pause}
      onMouseLeave={() => { resume(); onPointerUp(); }}
      onFocus={pause}
      onBlur={resume}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onScroll={onScroll}
      role="region"
      aria-label="Nocturna editorial: sets, video, interviews and event recaps"
    >
      <div className="media-ribbon-track">
        {looped.map((item, i) => <Card item={item} key={`${item.id}-${i}`} />)}
      </div>
    </div>
  );
}
