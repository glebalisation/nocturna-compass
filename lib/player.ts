export type ProviderKind = 'audio' | 'soundcloud' | 'mixcloud' | 'youtube';

export interface Track {
  id: string;
  kind: ProviderKind;
  title: string;
  artist: string;
  src: string;         // direct audio URL for 'audio'; the platform URL for embed kinds
  description?: string;
  relatedHref?: string; // e.g. an /events/[slug] page
  relatedLabel?: string;
}

/**
 * Only the 'audio' kind gets real, custom transport controls (play/pause/seek/
 * volume) via the native <audio> element — that's the one kind we can fully
 * own. SoundCloud/Mixcloud/YouTube render as their own official embed with
 * their own native controls; wiring real postMessage transport control for
 * those is future work (their widget SDKs), not something to fake here.
 */
export function embedUrlFor(track: Track): string | null {
  switch (track.kind) {
    case 'soundcloud':
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(track.src)}&auto_play=false&color=%23173d2b&show_teaser=false`;
    case 'mixcloud':
      return `https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(track.src)}&autoplay=0`;
    case 'youtube':
      return `https://www.youtube.com/embed/${track.src}?autoplay=0`;
    default:
      return null;
  }
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
