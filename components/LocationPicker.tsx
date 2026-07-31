'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NEIGHBORHOODS } from '@/lib/types';

const STORAGE_KEY = 'nocturna_hood';

function nearestNeighborhood(lat: number, lng: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  let best: (typeof NEIGHBORHOODS)[number] | null = null;
  let bestDist = Infinity;
  for (const n of NEIGHBORHOODS) {
    const dLat = toRad(n.lat - lat);
    const dLng = toRad(n.lng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(n.lat)) * Math.sin(dLng / 2) ** 2;
    const dist = 2 * Math.asin(Math.sqrt(a));
    if (dist < bestDist) { bestDist = dist; best = n; }
  }
  return best;
}

export default function LocationPicker({ basePath, hood }: { basePath: string; hood?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'locating' | 'denied'>('idle');

  // Apply a saved district once, on first load, if the URL doesn't already specify one.
  useEffect(() => {
    if (hood) return;
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved && NEIGHBORHOODS.some(n => n.slug === saved)) {
      router.replace(`${basePath}?hood=${saved}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (slug?: string) => {
    if (slug) localStorage.setItem(STORAGE_KEY, slug);
    else localStorage.removeItem(STORAGE_KEY);
    router.push(slug ? `${basePath}?hood=${slug}` : basePath);
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = nearestNeighborhood(pos.coords.latitude, pos.coords.longitude);
        setStatus('idle');
        if (nearest) goTo(nearest.slug);
      },
      () => setStatus('denied'),
      { timeout: 8000 }
    );
  };

  return (
    <div className="location-picker">
      <button type="button" className="chip" onClick={useMyLocation} disabled={status === 'locating'}>
        {status === 'locating' ? 'Locating…' : 'Use my location'}
      </button>
      <select
        aria-label="Choose a district"
        value={hood ?? ''}
        onChange={(e) => goTo(e.target.value || undefined)}
      >
        <option value="">All of Los Angeles</option>
        {NEIGHBORHOODS.map(n => (
          <option key={n.slug} value={n.slug}>{n.name}</option>
        ))}
      </select>
      {status === 'denied' && (
        <span className="location-picker-note">Location unavailable — pick a district instead.</span>
      )}
    </div>
  );
}
