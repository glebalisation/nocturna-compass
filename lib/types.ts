export type EventStatus =
  | 'new' | 'needs_review' | 'duplicate'
  | 'approved' | 'featured' | 'rejected' | 'archived';

export interface NocturnaEvent {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  date: string;            // YYYY-MM-DD
  start_time?: string | null;
  end_time?: string | null;
  venue_name?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  indoor?: boolean | null;
  secret_location?: boolean;
  genres: string[];
  lineup: string[];
  promoter?: string | null;
  price?: string | null;
  is_free?: boolean;
  guest_list?: boolean;
  ticket_url?: string | null;
  instagram_url?: string | null;
  ra_url?: string | null;
  image_url?: string | null;
  age_restriction?: string | null;
  tags?: string[];
  source_links?: { source: string; url: string }[];
  status: EventStatus;
  featured?: boolean;
  source: string;
  source_url?: string | null;
  contact_email?: string | null;
  created_at?: string;
}

export type LocatedEvent = NocturnaEvent & { lat: number; lng: number };

/** Events the compass can point at: has coordinates and isn't a secret-location drop. */
export function hasCoords(e: NocturnaEvent): e is LocatedEvent {
  return !e.secret_location && typeof e.lat === 'number' && typeof e.lng === 'number';
}

export const GENRES = ['techno', 'house', 'melodic', 'bass', 'minimal', 'electro'] as const;

export const TAGS = ['techno', 'house', 'melodic', 'bass', 'warehouse', 'rooftop', 'festival', 'afterhours', 'free', '21+'] as const;

/**
 * Top-level event categories. Stored as an entry in the existing `tags[]`
 * column (no schema change needed) — an event with no category tag defaults
 * to "Music", since every event in the system predates this taxonomy.
 */
export const CATEGORIES = [
  { slug: 'music', name: 'Music' },
  { slug: 'culture', name: 'Culture' },
  { slug: 'art', name: 'Art' },
  { slug: 'exhibition', name: 'Exhibitions' },
  { slug: 'theatre', name: 'Theatre' },
  { slug: 'performance', name: 'Performance' },
  { slug: 'film', name: 'Film' },
  { slug: 'community', name: 'Community' },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

const NON_MUSIC_CATEGORY_SLUGS: string[] = CATEGORIES
  .map(c => c.slug)
  .filter(slug => slug !== 'music');

/** Resolve the category an event belongs to (defaults to "music"). */
export function eventCategory(e: Pick<NocturnaEvent, 'tags'>): CategorySlug {
  const tag = (e.tags ?? []).find(t => NON_MUSIC_CATEGORY_SLUGS.includes(t));
  return (tag as CategorySlug | undefined) ?? 'music';
}

export const NEIGHBORHOODS = [
  { slug: 'downtown-la', name: 'Downtown LA', lat: 34.0407, lng: -118.2468 },
  { slug: 'arts-district', name: 'Arts District', lat: 34.0341, lng: -118.2334 },
  { slug: 'hollywood', name: 'Hollywood', lat: 34.1016, lng: -118.3269 },
  { slug: 'west-hollywood', name: 'West Hollywood', lat: 34.0900, lng: -118.3617 },
  { slug: 'silver-lake', name: 'Silver Lake', lat: 34.0900, lng: -118.2708 },
  { slug: 'echo-park', name: 'Echo Park', lat: 34.0781, lng: -118.2606 },
  { slug: 'venice', name: 'Venice', lat: 33.9850, lng: -118.4695 },
  { slug: 'santa-monica', name: 'Santa Monica', lat: 34.0195, lng: -118.4912 },
  { slug: 'koreatown', name: 'Koreatown', lat: 34.0621, lng: -118.3089 },
  { slug: 'long-beach', name: 'Long Beach', lat: 33.7701, lng: -118.1937 },
] as const;
