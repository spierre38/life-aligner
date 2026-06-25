-- push_subscriptions: stores Web Push API subscriptions per user
-- One user can have multiple subscriptions (phone, tablet, laptop, etc.)

create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null,
  p256dh        text not null,
  auth          text not null,
  notify_hour   int  not null default 8,   -- hour (0-23) in user's local time, stored as UTC hour
  notify_minute int  not null default 0,
  timezone      text not null default 'America/New_York',
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- one subscription endpoint per user (upsert safe)
  unique(user_id, endpoint)
);

-- RLS: users can only read/write their own subscriptions
alter table public.push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on public.push_subscriptions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role (used by the cron API route) can read all subscriptions to send notifications
create policy "Service role reads all push subscriptions"
  on public.push_subscriptions
  for select
  using (auth.role() = 'service_role');

-- Auto-update updated_at
create or replace function public.update_push_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.update_push_subscriptions_updated_at();
