-- Nocturna Compass · v2 migration
-- Run AFTER schema.sql in Supabase SQL Editor

-- ============ EVENTS: v2 fields ============
alter table events
  add column if not exists age_restriction text,          -- '18+' | '21+' | 'all ages'
  add column if not exists tags text[] default '{}',      -- techno house melodic bass warehouse rooftop festival afterhours free 21+
  add column if not exists source_links jsonb default '[]'::jsonb, -- [{source, url}] merged from all duplicates
  add column if not exists last_seen_at timestamptz default now(); -- collector touched it (stale detection)

create index if not exists events_tags_idx on events using gin(tags);

-- ============ SUBSCRIBERS: v2 fields ============
alter table subscribers
  add column if not exists phone text,
  add column if not exists genres text[] default '{}',
  add column if not exists areas text[] default '{}',
  add column if not exists consent boolean default false,
  add column if not exists sms_consent boolean default false,
  add column if not exists referral_code text unique,
  add column if not exists referred_by text,               -- referral_code of the inviter
  add column if not exists referral_count int default 0;

create index if not exists subscribers_referral_idx on subscribers(referral_code);

-- ============ CLICK TRACKING ============
create table if not exists clicks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  kind text not null default 'ticket' check (kind in ('ticket','view','share')),
  created_at timestamptz default now()
);
create index if not exists clicks_event_idx on clicks(event_id);
create index if not exists clicks_created_idx on clicks(created_at);
alter table clicks enable row level security;
-- inserts via service role only; no public policies

-- ============ NEWSLETTER ISSUES ============
create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  week_of date not null,
  subject text,
  html text,
  recipients int default 0,
  sent_at timestamptz,
  created_at timestamptz default now()
);
alter table newsletters enable row level security;

-- ============ SOURCES: more kinds ============
alter table sources drop constraint if exists sources_kind_check;
alter table sources add constraint sources_kind_check
  check (kind in ('jsonld','ics','ra','dice','eventbrite','edmtrain','19hz','dola','shotgun','facebook','instagram','custom'));

-- ============ SEED SOURCES (edit URLs to real ones) ============
insert into sources (name, url, kind, notes) values
  ('19hz Los Angeles', 'https://19hz.info/eventlisting_LosAngeles.php', '19hz',
   'Volunteer-run public listing — best free source for LA underground. Courtesy: email 19hzinfo@gmail.com before heavy use'),
  ('EDMTrain Los Angeles', 'https://edmtrain.com/los-angeles', 'edmtrain',
   'Official API, set EDMTRAIN_API_KEY + EDMTRAIN_ENABLED=true. WARNING: their ToS forbids combining with other sources in a competing discovery service — get written OK first'),
  ('DoLA electronic', 'https://dola.com/events', 'jsonld',
   'DoLA event pages embed schema.org JSON-LD'),
  ('Resident Advisor LA', 'https://ra.co/events/us/losangeles', 'ra',
   'DISABLED by default — enable only with RA data permission; set RA_ENABLED=true')
on conflict do nothing;
