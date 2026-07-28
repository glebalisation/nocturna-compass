-- Nocturna Compass · compass feature migration
-- Run AFTER schema.sql and migration-002-v2.sql in Supabase SQL Editor

-- ============ EVENTS: coordinates ============
-- Populated by the Facebook collector automatically (place.location), or by
-- hand in /admin or the Table Editor for manually-entered events. The
-- /compass page only points to events that have both set.
alter table events
  add column if not exists lat double precision,
  add column if not exists lng double precision;

create index if not exists events_coords_idx on events(lat, lng) where lat is not null and lng is not null;
