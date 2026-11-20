-- Run this once in your Supabase project's SQL Editor to enable
-- server-triggered iOS Push Notifications (APNs).
--
-- Stores each signed-in user's iOS device push token(s). Row Level Security
-- restricts every user to managing only their own device tokens; the
-- `send-push` edge function reads tokens using the service-role key.

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null default 'ios',
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.device_push_tokens enable row level security;

create policy "Users can read their own push tokens"
  on public.device_push_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push tokens"
  on public.device_push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own push tokens"
  on public.device_push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own push tokens"
  on public.device_push_tokens for delete
  using (auth.uid() = user_id);
