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

export const GENRES = ['techno', 'house', 'melodic', 'bass', 'minimal', 'electro'] as const;

export const TAGS = ['techno', 'house', 'melodic', 'bass', 'warehouse', 'rooftop', 'festival', 'afterhours', 'free', '21+'] as const;

export const NEIGHBORHOODS = [
  { slug: 'downtown-la', name: 'Downtown LA' },
  { slug: 'arts-district', name: 'Arts District' },
  { slug: 'hollywood', name: 'Hollywood' },
  { slug: 'west-hollywood', name: 'West Hollywood' },
  { slug: 'silver-lake', name: 'Silver Lake' },
  { slug: 'echo-park', name: 'Echo Park' },
  { slug: 'venice', name: 'Venice' },
  { slug: 'santa-monica', name: 'Santa Monica' },
  { slug: 'koreatown', name: 'Koreatown' },
  { slug: 'long-beach', name: 'Long Beach' },
] as const;
