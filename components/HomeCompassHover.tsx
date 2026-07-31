'use client';

import { createContext, useContext, useMemo, useState } from 'react';

interface HoverApi {
  hoverAngle: number | null;
  setHoverAngle: (deg: number | null) => void;
}

const HoverContext = createContext<HoverApi | null>(null);

/** Bridges event-card hover (in the grid) to the compass needle (elsewhere on the page) — siblings, not parent/child, hence the context. */
export function HomeCompassHoverProvider({ children }: { children: React.ReactNode }) {
  const [hoverAngle, setHoverAngle] = useState<number | null>(null);
  const api = useMemo(() => ({ hoverAngle, setHoverAngle }), [hoverAngle]);
  return <HoverContext.Provider value={api}>{children}</HoverContext.Provider>;
}

/** Safe outside the provider (e.g. HomeCompass used on a page without it) — just reports no external hover. */
export function useCompassHover(): HoverApi {
  return useContext(HoverContext) ?? { hoverAngle: null, setHoverAngle: () => {} };
}
