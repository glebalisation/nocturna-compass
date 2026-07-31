'use client';

import { useCompassHover } from './HomeCompassHover';
import { LA_CENTER, bearingDeg } from '@/lib/compass-math';
import { hasCoords, type NocturnaEvent } from '@/lib/types';

/** Wraps an EventCard so hovering it points the (sibling) homepage compass toward that event's real-world direction. */
export default function EventHoverTarget({ event, children }: { event: NocturnaEvent; children: React.ReactNode }) {
  const { setHoverAngle } = useCompassHover();
  if (!hasCoords(event)) return <>{children}</>;

  const angle = bearingDeg(LA_CENTER.lat, LA_CENTER.lon, event.lat, event.lng);
  return (
    <div onMouseEnter={() => setHoverAngle(angle)} onMouseLeave={() => setHoverAngle(null)}>
      {children}
    </div>
  );
}
