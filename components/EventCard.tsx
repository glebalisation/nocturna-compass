import Link from 'next/link';
import type { NocturnaEvent } from '@/lib/types';

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles',
  });
}

/** Generative flyer gradient when there's no image yet. */
function flyer(e: NocturnaEvent) {
  const lightness = 14 + (e.title.length * 3) % 10;
  return `radial-gradient(120% 90% at 24% 10%, hsl(220 8% ${lightness + 8}%) 0%, transparent 60%),
          radial-gradient(100% 100% at 80% 90%, hsl(220 6% ${lightness}%) 0%, #05070B 70%),
          repeating-linear-gradient(52deg, transparent 0 9px, hsl(220 6% ${lightness}% / .5) 9px 10px)`;
}

export default function EventCard({ e }: { e: NocturnaEvent }) {
  const style = e.image_url
    ? { backgroundImage: `url(${e.image_url})` }
    : { background: flyer(e) };
  return (
    <Link href={`/events/${e.slug}`} className="card" prefetch={false}>
      <div className="card-visual" style={style}>
        <div className="tag-row">
          {e.genres.slice(0, 2).map(g => <span key={g} className="tag">{g}</span>)}
          {e.secret_location && <span className="tag">secret location</span>}
          {e.featured && <span className="tag">nocturna pick</span>}
        </div>
      </div>
      <div className="card-body">
        <div className="card-date">
          {fmtDate(e.date)}{e.start_time ? ` · ${e.start_time}` : ''}
        </div>
        <h3>{e.title}</h3>
        {e.lineup.length > 0 && <div className="lineup">{e.lineup.join(' · ')}</div>}
        <div className="meta">
          <span>{e.secret_location ? 'Secret · TBA' : (e.venue_name ?? 'TBA')}{e.neighborhood ? ` · ${e.neighborhood}` : ''}</span>
          <span className="price">{e.is_free ? 'Free' : (e.price ?? '')}</span>
        </div>
      </div>
    </Link>
  );
}
