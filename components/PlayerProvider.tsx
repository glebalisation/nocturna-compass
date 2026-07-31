'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { Track } from '@/lib/player';

interface PlayerState {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  expanded: boolean;
}

interface PlayerApi extends PlayerState {
  play: (track: Track) => void;
  toggle: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setExpanded: (v: boolean) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerApi | null>(null);

export function usePlayer(): PlayerApi {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>({
    track: null, isPlaying: false, currentTime: 0, duration: 0, volume: 0.8, muted: false, expanded: false,
  });

  // Never autoplay: play() only ever runs from a direct user click (card / mini-player button).
  const play = useCallback((track: Track) => {
    setState(s => {
      const sameTrack = s.track?.id === track.id;
      return { ...s, track, isPlaying: true, currentTime: sameTrack ? s.currentTime : 0 };
    });
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (el && track.kind === 'audio') {
        if (el.src !== track.src) { el.src = track.src; el.currentTime = 0; }
        el.play().catch(() => {});
      }
    });
  }, []);

  const toggle = useCallback(() => {
    setState(s => {
      const next = !s.isPlaying;
      const el = audioRef.current;
      if (el && s.track?.kind === 'audio') { if (next) el.play().catch(() => {}); else el.pause(); }
      return { ...s, isPlaying: next };
    });
  }, []);

  const seek = useCallback((t: number) => {
    const el = audioRef.current;
    if (el) el.currentTime = t;
    setState(s => ({ ...s, currentTime: t }));
  }, []);

  const setVolume = useCallback((v: number) => {
    const el = audioRef.current;
    if (el) el.volume = v;
    setState(s => ({ ...s, volume: v, muted: v === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    setState(s => {
      const next = !s.muted;
      const el = audioRef.current;
      if (el) el.muted = next;
      return { ...s, muted: next };
    });
  }, []);

  const setExpanded = useCallback((v: boolean) => setState(s => ({ ...s, expanded: v })), []);

  const close = useCallback(() => {
    const el = audioRef.current;
    if (el) el.pause();
    setState({ track: null, isPlaying: false, currentTime: 0, duration: 0, volume: state.volume, muted: state.muted, expanded: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.volume, state.muted]);

  const api = useMemo<PlayerApi>(() => ({
    ...state, play, toggle, seek, setVolume, toggleMute, setExpanded, close,
  }), [state, play, toggle, seek, setVolume, toggleMute, setExpanded, close]);

  return (
    <PlayerContext.Provider value={api}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => { const currentTime = e.currentTarget.currentTime; setState(s => ({ ...s, currentTime })); }}
        onLoadedMetadata={(e) => { const duration = e.currentTarget.duration || 0; setState(s => ({ ...s, duration })); }}
        onEnded={() => setState(s => ({ ...s, isPlaying: false }))}
      />
    </PlayerContext.Provider>
  );
}
