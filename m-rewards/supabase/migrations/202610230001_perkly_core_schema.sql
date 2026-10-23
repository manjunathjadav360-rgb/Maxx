-- Perkly Phase 2 foundation.
-- Apply only to the dedicated Perkly Supabase project after reviewing.
-- This migration defines data structures and RLS; it does not enable real payouts.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.earning_tasks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  title text not null check (char_length(title) between 2 and 100),
  description text not null default '' check (char_length(description) <= 500),
  points integer not null check (points between 1 and 100000),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  title text not null check (char_length(title) between 2 and 100),
  description text not null default '' check (char_length(description) <= 500),
  points_cost integer not null check (points_cost between 1 and 10000000),
  active boolean not null default false,
  inventory integer check (inventory is null or inventory >= 0),
  created_at timestamptz not null default now()
);

-- Append-only user points ledger. Positive values credit; negative values debit.
-- There is intentionally no client INSERT/UPDATE/DELETE policy.
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0 and amount between -10000000 and 10000000),
  reason text not null check (char_length(reason) between 2 and 120),
  source_type text not null check (source_type in ('task', 'redemption', 'adjustment')),
  source_id uuid,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists points_ledger_user_created_idx
  on public.points_ledger (user_id, created_at desc);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.earning_tasks(id) on delete restrict,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 160),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (user_id, task_id),
  unique (user_id, idempotency_key)
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  points_cost integer not null check (points_cost > 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'fulfilled', 'rejected', 'cancelled')),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists redemptions_user_created_idx
  on public.redemptions (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.earning_tasks enable row level security;
alter table public.rewards enable row level security;
alter table public.points_ledger enable row level security;
alter table public.task_completions enable row level security;
alter table public.redemptions enable row level security;

-- Users can only read/update their own profile; ownership cannot be changed.
drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profile_insert_own" on public.profiles;
create policy "profile_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Active catalogue rows are public to signed-in users. No client write policies.
drop policy if exists "tasks_read_active" on public.earning_tasks;
create policy "tasks_read_active" on public.earning_tasks
  for select to authenticated using (active = true);
drop policy if exists "rewards_read_active" on public.rewards;
create policy "rewards_read_active" on public.rewards
  for select to authenticated using (active = true);

drop policy if exists "ledger_read_own" on public.points_ledger;
create policy "ledger_read_own" on public.points_ledger
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "completions_read_own" on public.task_completions;
create policy "completions_read_own" on public.task_completions
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "redemptions_read_own" on public.redemptions;
create policy "redemptions_read_own" on public.redemptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- Important: client roles intentionally have no policies to create task completions,
-- award points, alter the ledger, or submit/fulfill redemptions. Add vetted server-side
-- RPC/Edge Function workflows with transactionality and idempotency before enabling those flows.

grant select, insert, update on public.profiles to authenticated;
grant select on public.earning_tasks, public.rewards to authenticated;
grant select on public.points_ledger, public.task_completions, public.redemptions to authenticated;
