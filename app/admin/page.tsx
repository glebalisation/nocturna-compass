import { supabaseAdmin } from '@/lib/supabase';
import ModerationQueue from './queue';
import type { NocturnaEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Stats {
  collectedToday: number; queue: number; publishedWeek: number;
  subscribers: number; topClicked: { title: string; clicks: number }[];
  topGenres: { genre: string; n: number }[];
  lastIssue?: { week_of: string; recipients: number; sent_at: string | null };
}

async function loadStats(): Promise<Stats | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [collected, queue, published, subs, clicks, genresRows, issue] = await Promise.all([
    sb.from('events').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    sb.from('events').select('id', { count: 'exact', head: true }).in('status', ['new', 'needs_review']),
    sb.from('events').select('id', { count: 'exact', head: true }).in('status', ['approved', 'featured']).gte('updated_at', weekAgo),
    sb.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('clicks').select('event_id, events(title)').gte('created_at', weekAgo).limit(1000),
    sb.from('events').select('genres').in('status', ['approved', 'featured']).limit(500),
    sb.from('newsletters').select('week_of, recipients, sent_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const clickAgg = new Map<string, { title: string; clicks: number }>();
  for (const c of (clicks.data ?? []) as any[]) {
    const title = c.events?.title ?? '—';
    const cur = clickAgg.get(c.event_id) ?? { title, clicks: 0 };
    cur.clicks++; clickAgg.set(c.event_id, cur);
  }
  const topClicked = [...clickAgg.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  const genreAgg = new Map<string, number>();
  for (const row of (genresRows.data ?? []) as any[]) {
    for (const g of row.genres ?? []) genreAgg.set(g, (genreAgg.get(g) ?? 0) + 1);
  }
  const topGenres = [...genreAgg.entries()].map(([genre, n]) => ({ genre, n }))
    .sort((a, b) => b.n - a.n).slice(0, 6);

  return {
    collectedToday: collected.count ?? 0,
    queue: queue.count ?? 0,
    publishedWeek: published.count ?? 0,
    subscribers: subs.count ?? 0,
    topClicked, topGenres,
    lastIssue: issue.data ?? undefined,
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = 'queue' } = await searchParams;
  const sb = supabaseAdmin();
  const stats = await loadStats();

  let events: NocturnaEvent[] = [];
  if (sb) {
    const statuses = view === 'published'
      ? ['approved', 'featured']
      : view === 'rejected' ? ['rejected', 'duplicate', 'archived'] : ['new', 'needs_review'];
    const { data } = await sb.from('events').select('*')
      .in('status', statuses).order('date', { ascending: true }).limit(150);
    events = (data ?? []) as NocturnaEvent[];
  }

  const S = ({ n, label }: { n: number | string; label: string }) => (
    <div style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '16px 20px', minWidth: 130 }}>
      <b style={{ fontSize: 24, display: 'block' }}>{n}</b>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );

  return (
    <main>
      <section className="container">
        <div className="eyebrow">Admin dashboard</div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,48px)' }}>Control room</h1>

        {stats && (
          <>
            <div style={{ display: 'flex', gap: 14, margin: '30px 0 10px', flexWrap: 'wrap' }}>
              <S n={stats.collectedToday} label="collected today" />
              <S n={stats.queue} label="need approval" />
              <S n={stats.publishedWeek} label="published this week" />
              <S n={stats.subscribers} label="subscribers" />
              <S n={stats.lastIssue ? (stats.lastIssue.sent_at ? '✓' : 'draft') : '—'}
                 label={`last issue ${stats.lastIssue?.week_of ?? ''}`} />
            </div>

            <div style={{ display: 'flex', gap: 40, margin: '18px 0 8px', flexWrap: 'wrap', fontSize: 13 }}>
              {stats.topClicked.length > 0 && (
                <div>
                  <div className="flabel" style={{ marginBottom: 8 }}>Top clicked (7d)</div>
                  {stats.topClicked.map(t => (
                    <div key={t.title} style={{ padding: '4px 0', color: 'var(--muted)' }}>
                      <b style={{ color: 'var(--text)' }}>{t.clicks}</b> · {t.title}
                    </div>
                  ))}
                </div>
              )}
              {stats.topGenres.length > 0 && (
                <div>
                  <div className="flabel" style={{ marginBottom: 8 }}>Top genres (published)</div>
                  {stats.topGenres.map(g => (
                    <div key={g.genre} style={{ padding: '4px 0', color: 'var(--muted)' }}>
                      <b style={{ color: 'var(--text)' }}>{g.n}</b> · {g.genre}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ maxWidth: 280, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                Open / click rates live in the Resend dashboard (Broadcasts → issue).
                Subscriber emails stay in your Supabase — the base is yours.
              </div>
            </div>
          </>
        )}

        <div className="filters" style={{ marginTop: 20 }}>
          <a className={`chip ${view === 'queue' ? 'on' : ''}`} href="/admin?view=queue">Queue</a>
          <a className={`chip ${view === 'published' ? 'on' : ''}`} href="/admin?view=published">Published</a>
          <a className={`chip ${view === 'rejected' ? 'on' : ''}`} href="/admin?view=rejected">Rejected / archived</a>
        </div>

        {!sb
          ? <div className="notice err">Supabase не налаштований — додай ключі в .env.local.</div>
          : <ModerationQueue initial={events} />}
      </section>
    </main>
  );
}
