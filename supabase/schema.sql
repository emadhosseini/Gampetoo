-- Run this once in your Supabase project's SQL editor (Database → SQL Editor).
--
-- Storage model: one row per account, holding the entire set of synced
-- localStorage blobs (program, session, workout/warmup overrides, free-meal
-- lock, display name) as a single JSON object, keyed by base storage key.
-- Row Level Security ensures a user's JWT (from supabase.auth) can only ever
-- read/write their own row — the anon key alone grants nothing.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users can read their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- After running this:
-- 1. Authentication → Providers → Email → turn OFF "Confirm email".
--    Usernames are mapped to a synthetic @gampetoo.local address (see
--    src/auth/authEngine.ts), which can't receive a real confirmation email.
-- 2. Project Settings → API → copy the Project URL and anon/public key into
--    this app's .env.local (see .env.example).
