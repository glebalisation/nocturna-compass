export type MediaKind =
  | 'article' | 'set' | 'video' | 'interview' | 'venue'
  | 'recap' | 'playlist' | 'photo' | 'recommendation';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  meta: string;       // short metadata line, e.g. "Downtown LA · warehouse techno"
  duration: string;   // "6 min read", "58 min", etc.
  source: string;     // "Nocturna Editorial", "Nocturna Originals"...
  href?: string;       // only set when there's a real destination on the site today
}

export const KIND_LABEL: Record<MediaKind, string> = {
  article: 'Article',
  set: 'DJ Set',
  video: 'Video',
  interview: 'Interview',
  venue: 'Venue Profile',
  recap: 'Event Recap',
  playlist: 'Playlist',
  photo: 'Photo Essay',
  recommendation: 'Recommendation',
};

export const KIND_ICON: Record<MediaKind, string> = {
  article: '✎',
  set: '♫',
  video: '▶',
  interview: '“',
  venue: '◈',
  recap: '↺',
  playlist: '≣',
  photo: '◫',
  recommendation: '→',
};

/**
 * Placeholder editorial content for the homepage discovery ribbon — Nocturna
 * doesn't have a CMS wired up yet, so this stands in the same way DEMO_EVENTS
 * does for the event feed. Only items with a real page on the site link out;
 * the rest render as non-interactive tiles until there's something to open.
 */
export const DEMO_MEDIA: MediaItem[] = [
  { id: 'm1', kind: 'recap', title: 'Inside Concrete Ritual: a night at Vault 1904', meta: 'Downtown LA · warehouse techno', duration: '6 min read', source: 'Nocturna Editorial', href: '/events' },
  { id: 'm2', kind: 'set', title: 'Vera Holt — live at the vault', meta: 'Recorded set · techno', duration: '58 min', source: 'Nocturna Originals' },
  { id: 'm3', kind: 'interview', title: 'Ama Diallo on building a house night from scratch', meta: 'Arts District residency', duration: '9 min read', source: 'Nocturna Editorial' },
  { id: 'm4', kind: 'venue', title: 'Signal Room: the Silver Lake room built for minimal', meta: 'Venue profile', duration: '4 min read', source: 'Nocturna Editorial', href: '/la/silver-lake' },
  { id: 'm5', kind: 'photo', title: 'Static Bloom, in stills', meta: 'Echo Park · electro', duration: '18 photos', source: 'Nocturna Originals' },
  { id: 'm6', kind: 'playlist', title: 'Afterhours: the 4am playlist', meta: 'Rotating selections', duration: '2 hr 10 min', source: 'Nocturna Originals' },
  { id: 'm7', kind: 'article', title: 'A short history of LA warehouse parties', meta: 'Culture · long read', duration: '11 min read', source: 'Nocturna Editorial' },
  { id: 'm8', kind: 'recommendation', title: 'Five rooftop sets worth the door tax', meta: 'Editors’ picks', duration: '5 min read', source: 'Nocturna Editorial', href: '/tonight' },
  { id: 'm9', kind: 'video', title: 'Low Orbit: behind the decks', meta: 'Nocturna Originals · short doc', duration: '12 min', source: 'Nocturna Originals' },
  { id: 'm10', kind: 'venue', title: 'The Greenhouse: a house night in the Arts District', meta: 'Venue profile', duration: '4 min read', source: 'Nocturna Editorial', href: '/la/arts-district' },
];
