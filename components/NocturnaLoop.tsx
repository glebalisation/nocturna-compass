'use client';

import Link from 'next/link';
import { KIND_ICON, KIND_LABEL, type MediaItem } from '@/lib/media';
import { usePlayer } from './PlayerProvider';

/** Deterministic size rhythm so the column reads as an edited magazine
 * layout — not random noise, but not uniform either. */
const SIZE_PATTERN = ['lg', 'sm', 'md', 'sm', 'lg', 'md'] as const;
type Size = (typeof SIZE_PATTERN)[number];

function sizeFor(i: number): Size {
  return SIZE_PATTERN[i % SIZE_PATTERN.length];
}

function Block({ item, size }: { item: MediaItem; size: Size }) {
  const { play } = usePlayer();
  const inner = (
    <>
      <div className="loop-block-top">
        <span className="loop-block-icon" aria-hidden="true">{KIND_ICON[item.kind]}</span>
        <span className="tag">{KIND_LABEL[item.kind]}</span>
      </div>
      <h3>{item.title}</h3>
      <div className="loop-block-meta">
        <span>{item.meta}</span>
        <span>{item.duration}</span>
      </div>
      {(item.href || item.track) && (
        <span className="loop-block-go" aria-hidden="true">
          {item.track ? 'Play →' : 'Open →'}
        </span>
      )}
    </>
  );

  const className = `loop-block loop-block-${size}`;
  if (item.track) {
    return (
      <button type="button" className={`${className} loop-block-button`} onClick={() => play(item.track!)} draggable={false}>
        {inner}
      </button>
    );
  }
  return item.href
    ? <Link href={item.href} className={className} draggable={false}>{inner}</Link>
    : <article className={`${className} loop-block-static`} aria-label={`${KIND_LABEL[item.kind]}: ${item.title} (coming soon)`}>{inner}</article>;
}

function Column({ items, duration, offset = 0 }: { items: MediaItem[]; duration: number; offset?: number }) {
  const looped = [...items, ...items];
  return (
    <div className="loop-col">
      <div className="loop-col-track" style={{ animationDuration: `${duration}s`, animationDelay: `${-offset}s` }}>
        {looped.map((item, i) => (
          <Block key={`${item.id}-${i}`} item={item} size={sizeFor(i)} />
        ))}
      </div>
    </div>
  );
}

/** The homepage "Nocturna loop" — a vertical, continuously drifting column
 * feed of mixed-size editorial blocks, evoking a scrolling magazine spread
 * rather than a horizontal ribbon. Two columns drift at different speeds. */
export default function NocturnaLoop({ items }: { items: MediaItem[] }) {
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);
  return (
    <div className="nocturna-loop" role="region" aria-label="Nocturna editorial: sets, video, interviews and event recaps">
      <Column items={left} duration={34} />
      <Column items={right.length ? right : left} duration={44} offset={9} />
    </div>
  );
}
