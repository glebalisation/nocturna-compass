import { createHash } from 'crypto';

/** Normalize a string for fingerprinting: lowercase, strip accents/punctuation/spaces. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Duplicate fingerprint: same normalized title + date + venue ⇒ same event.
 * Stored in events.fingerprint with a unique partial index, so a second
 * insert of the same event fails silently and lands nowhere twice.
 */
export function fingerprint(title: string, date: string, venue?: string | null): string {
  return createHash('sha1')
    .update([norm(title), date, norm(venue ?? '')].join('|'))
    .digest('hex');
}

export function slugify(title: string, date: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${base}-${date}`;
}
