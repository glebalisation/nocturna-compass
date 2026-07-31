'use client';

import { useEffect } from 'react';
import { usePlayer } from './PlayerProvider';
import { embedUrlFor, formatTime } from '@/lib/player';

export default function StickyPlayer() {
  const { track, isPlaying, currentTime, duration, volume, muted, expanded, toggle, seek, setVolume, toggleMute, setExpanded, close } = usePlayer();

  useEffect(() => {
    document.body.classList.toggle('has-sticky-player', !!track);
    return () => document.body.classList.remove('has-sticky-player');
  }, [track]);

  if (!track) return null;

  const isNative = track.kind === 'audio';
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  function onSeekClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isNative || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(frac * duration);
  }

  return (
    <div className={`sticky-player${expanded ? ' expanded' : ''}`} role="region" aria-label="Now playing">
      {expanded && (
        <div className="sticky-player-full">
          <div className="sticky-player-full-art" aria-hidden="true">
            <span>{track.title.slice(0, 1)}</span>
          </div>
          <div className="sticky-player-full-info">
            <h3>{track.title}</h3>
            <p className="sticky-player-full-artist">{track.artist}</p>
            {track.description && <p className="sticky-player-full-desc">{track.description}</p>}
            <div className="sticky-player-full-links">
              {track.relatedHref && (
                <a href={track.relatedHref} className="compass-link">{track.relatedLabel ?? 'Related event →'}</a>
              )}
              <button
                type="button"
                className="compass-link"
                onClick={async () => {
                  const shareData = { title: track.title, text: track.artist, url: typeof window !== 'undefined' ? window.location.href : undefined };
                  if (navigator.share) { try { await navigator.share(shareData); } catch { /* user cancelled */ } }
                  else if (navigator.clipboard && shareData.url) navigator.clipboard.writeText(shareData.url).catch(() => {});
                }}
              >
                Share
              </button>
              {!isNative && (
                <a href={track.src} target="_blank" rel="noopener" className="compass-link">Open on source ↗</a>
              )}
            </div>
          </div>
          {!isNative && embedUrlFor(track) && (
            <iframe
              className="sticky-player-embed"
              src={embedUrlFor(track)!}
              title={`${track.title} — embedded player`}
              loading="lazy"
              allow="autoplay"
            />
          )}
        </div>
      )}

      <div className="sticky-player-bar">
        <button
          type="button"
          className="sticky-player-playpause"
          onClick={toggle}
          disabled={!isNative}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isNative ? undefined : 'Use the embedded player below to play this'}
        >
          {isPlaying && isNative ? '❚❚' : '▶'}
        </button>

        <div className="sticky-player-meta">
          <b>{track.title}</b>
          <span>{track.artist}</span>
        </div>

        {isNative ? (
          <div className="sticky-player-transport">
            <span className="sticky-player-time">{formatTime(currentTime)}</span>
            <div className="sticky-player-progress" onClick={onSeekClick}>
              <div className="sticky-player-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="sticky-player-time">{formatTime(duration)}</span>
          </div>
        ) : (
          <div className="sticky-player-transport sticky-player-transport-embed">
            <span>Expand to play (embedded)</span>
          </div>
        )}

        {isNative && (
          <div className="sticky-player-volume">
            <button type="button" className="sticky-player-mute" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted || volume === 0 ? '◔' : '◕'}
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
            />
          </div>
        )}

        <button type="button" className="sticky-player-icon-btn" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Collapse player' : 'Expand player'}>
          {expanded ? '⌄' : '⌃'}
        </button>
        <button type="button" className="sticky-player-icon-btn" onClick={close} aria-label="Close player">
          ✕
        </button>
      </div>
    </div>
  );
}
