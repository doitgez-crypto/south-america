-- =============================================
-- South America Travel Planner — Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────
create type attraction_category as enum (
  'Trek',
  'Food',
  'Nightlife',
  'Culture',
  'Logistics',
  'Must-See'
);

create type sa_country as enum (
  'Argentina',
  'Brazil',
  'Chile',
  'Peru',
  'Bolivia',
  'Colombia',
  'Ecuador'
);

-- ──────────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────────
create table if not exists profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text unique not null,
  username  text not null default '',
  trip_id   text not null default '',
  created_at timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ──────────────────────────────────────────────
-- ATTRACTIONS
-- ──────────────────────────────────────────────
create table if not exists attractions (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  created_by    uuid not null references auth.users(id) on delete set null,
  last_edited_by uuid references auth.users(id) on delete set null,
  trip_id       text not null,

  name          text not null,
  country       sa_country not null,
  category      attraction_category not null,
  description   text default '',
  rating        integer check (rating >= 1 and rating <= 5),
  coordinates   jsonb,                   -- { lat: number, lng: number }
  links         text[] default '{}',
  price_local   numeric(12, 2),
  currency_code text default 'USD',
  image_urls    text[] default '{}'
);

-- Auto-update updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on attractions;
create trigger set_updated_at
  before update on attractions
  for each row execute procedure touch_updated_at();

-- ──────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────
create index if not exists idx_attractions_trip_id  on attractions(trip_id);
create index if not exists idx_attractions_country  on attractions(country);
create index if not exists idx_attractions_category on attractions(category);
create index if not exists idx_attractions_rating   on attractions(rating);
create index if not exists idx_profiles_trip_id     on profiles(trip_id);

-- ──────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ──────────────────────────────────────────────
alter table profiles   enable row level security;
alter table attractions enable row level security;

-- Profiles: users can only read/update their own row
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Attractions: visible to users sharing the same trip_id
create policy "attractions_select_trip" on attractions for select
  using (
    trip_id = (select trip_id from profiles where id = auth.uid())
  );

create policy "attractions_insert_trip" on attractions for insert
  with check (
    trip_id = (select trip_id from profiles where id = auth.uid())
  );

create policy "attractions_update_trip" on attractions for update
  using (
    trip_id = (select trip_id from profiles where id = auth.uid())
  );

create policy "attractions_delete_trip" on attractions for delete
  using (
    trip_id = (select trip_id from profiles where id = auth.uid())
  );

-- ──────────────────────────────────────────────
-- STORAGE BUCKET
-- ──────────────────────────────────────────────
-- Run separately in Supabase dashboard or via CLI:
-- insert into storage.buckets (id, name, public)
-- values ('attraction-images', 'attraction-images', true);

-- Storage RLS (allow trip members to upload)
-- create policy "upload_images" on storage.objects for insert
--   with check (bucket_id = 'attraction-images' and auth.uid() is not null);
-- create policy "public_images" on storage.objects for select
--   using (bucket_id = 'attraction-images');

-- ──────────────────────────────────────────────
-- REALTIME
-- ──────────────────────────────────────────────
-- Enable realtime for attractions table in Supabase Dashboard:
-- Database -> Replication -> Tables -> enable attractions
