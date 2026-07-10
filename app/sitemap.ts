import type { MetadataRoute } from 'next';
import { getEvents, laToday } from '@/lib/data';
import { NEIGHBORHOODS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nocturnacompass.com';
  const events = await getEvents({ from: laToday(), limit: 500 });

  return [
    { url: site, changeFrequency: 'daily', priority: 1 },
    { url: `${site}/tonight`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site}/weekend`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site}/events`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${site}/map`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${site}/submit`, changeFrequency: 'monthly', priority: 0.5 },
    ...NEIGHBORHOODS.map(n => ({
      url: `${site}/la/${n.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...events.map(e => ({
      url: `${site}/events/${e.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
