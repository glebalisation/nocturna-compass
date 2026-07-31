import type { Metadata } from 'next';
import Link from 'next/link';
import SubscribeBand from '@/components/SubscribeBand';

export const metadata: Metadata = {
  title: 'About Nocturna Compass',
  description:
    'Nocturna Compass is a curated guide to electronic music, independent culture and events across Los Angeles — how we track, verify and cover the city.',
};

const SECTIONS = [
  {
    h: 'What Nocturna is',
    p: 'Nocturna is an independent nightlife and culture publication based in Los Angeles, built around one idea: the most interesting things happening in this city rarely announce themselves loudly.',
  },
  {
    h: 'What Nocturna Compass does',
    p: 'Compass is our live directory and discovery layer — a curated guide to electronic music, independent culture and events across Los Angeles. We track what is happening across the city, from daytime gatherings and exhibitions to warehouse events, performances and late-night sets.',
  },
  {
    h: 'Editorial and curation approach',
    p: 'Every listing is reviewed by an editor before it goes live. We favor original programming, independent promoters and venues over algorithmic aggregation — nothing is auto-published.',
  },
  {
    h: 'Types of events covered',
    p: 'Music, culture, art, exhibitions, theatre, performance, film and community gatherings — anywhere the underground and the independent scene intersect in LA.',
  },
  {
    h: 'How events are verified',
    p: 'Submissions and auto-collected listings enter a moderation queue and are checked against source links, venue details and duplicate fingerprints before approval. Nothing publishes automatically.',
  },
  {
    h: 'Los Angeles focus',
    p: 'Compass is built specifically for LA — its neighborhoods, its venues and its calendar — rather than as a generic city template.',
  },
  {
    h: 'Submission process',
    p: 'Anyone can submit an event for consideration. Submissions go into the same moderation queue as auto-collected listings and are reviewed before publishing.',
  },
  {
    h: 'Contact and partnerships',
    p: 'For partnerships, corrections or press, reach us on Instagram or through the submission form — both routes go directly to the editorial team.',
  },
];

export default function AboutPage() {
  return (
    <main>
      <section className="container">
        <div className="eyebrow">About</div>
        <h1>What&rsquo;s happening<br /><em>beneath the surface.</em></h1>
        <p className="lede">
          Nocturna Compass is a curated guide to electronic music, independent culture
          and events across Los Angeles. We track what is happening across the
          city—from daytime gatherings and exhibitions to warehouse events,
          performances and late-night sets.
        </p>

        <div style={{ display: 'grid', gap: 32, maxWidth: 720, marginTop: 56 }}>
          {SECTIONS.map(s => (
            <div key={s.h}>
              <h3 style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 10 }}>
                {s.h}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 15 }}>{s.p}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 48 }}>
          <Link href="/submit" className="btn btn-primary">Submit an event</Link>
          <Link href="/events" className="btn btn-ghost">Browse the directory</Link>
        </div>
      </section>
      <SubscribeBand source="about" />
    </main>
  );
}
