-- Nocturna Compass · Supabase schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists pgcrypto;

-- ============ ENUMS ============
do $$ begin
  create type event_status as enum
    ('new','needs_review','duplicate','approved','featured','rejected','archived');
exception when duplicate_object then null; end $$;

-- ============ VENUES ============
create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  neighborhood text,
  address text,
  venue_type text check (venue_type in ('club','warehouse','rooftop','openair','afterhours','other')),
  lat double precision,
  lng double precision,
  instagram text,
  website text,
  created_at timestamptz default now()
);

-- ============ EVENTS ============
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  date date not null,
  start_time text,
  end_time text,
  venue_id uuid references venues(id) on delete set null,
  venue_name text,
  neighborhood text,
  address text,
  secret_location boolean default false,
  genres text[] default '{}',
  lineup text[] default '{}',
  promoter text,
  price text,
  is_free boolean default false,
  guest_list boolean default false,
  indoor boolean default true,
  ticket_url text,
  instagram_url text,
  ra_url text,
  external_url text,
  image_url text,
  status event_status not null default 'new',
  featured boolean default false,
  source text not null default 'manual',        -- ra | dice | eventbrite | shotgun | instagram | venue_site | jsonld | submission | manual
  source_url text,
  contact_email text,                            -- for submissions
  fingerprint text,                              -- dedupe hash: title+date+venue
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists events_date_idx on events(date);
create index if not exists events_status_idx on events(status);
create index if not exists events_neighborhood_idx on events(neighborhood);
create unique index if not exists events_fingerprint_idx on events(fingerprint) where fingerprint is not null;

-- ============ SUBSCRIBERS (main business asset) ============
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text not null default 'active' check (status in ('active','unsubscribed','bounced')),
  source text default 'site',                    -- homepage | event_page | tonight | exit_popup | save_event
  interests text[] default '{}',                 -- genres/venues they follow (future personalization)
  created_at timestamptz default now()
);
create index if not exists subscribers_status_idx on subscribers(status);

-- ============ COLLECTION SOURCES ============
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  kind text not null default 'jsonld' check (kind in ('jsonld','ics','ra','dice','eventbrite','instagram','custom')),
  active boolean default true,
  last_run_at timestamptz,
  last_found int default 0,
  notes text,
  created_at timestamptz default now()
);

-- ============ updated_at trigger ============
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists events_updated_at on events;
create trigger events_updated_at before update on events
  for each row execute function set_updated_at();

-- ============ ROW LEVEL SECURITY ============
alter table events enable row level security;
alter table venues enable row level security;
alter table subscribers enable row level security;
alter table sources enable row level security;

-- Public can read only approved/featured events and all venues.
drop policy if exists "public read published events" on events;
create policy "public read published events" on events
  for select using (status in ('approved','featured'));

drop policy if exists "public read venues" on venues;
create policy "public read venues" on venues for select using (true);

-- Everything else (inserts, moderation, subscribers) goes through the
-- service role key in API routes — no public policies needed.

-- ============ SEED: a few venues ============
insert into venues (name, slug, neighborhood, venue_type) values
  ('Vault 1904','vault-1904','Downtown LA','warehouse'),
  ('The Greenhouse','the-greenhouse','Arts District','club'),
  ('Basement Echo','basement-echo','Echo Park','club'),
  ('Sable Rooftop','sable-rooftop','Hollywood','rooftop'),
  ('Signal Room','signal-room','Silver Lake','club'),
  ('Room Zero','room-zero','Downtown LA','afterhours')
on conflict (slug) do nothing;
