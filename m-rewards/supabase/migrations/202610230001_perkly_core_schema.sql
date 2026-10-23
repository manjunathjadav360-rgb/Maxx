-- Perkly core schema extension for the existing Supabase starter tables.
-- Safe/additive: preserves existing text IDs and data. No real payouts are enabled.

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.earning_tasks
  add column if not exists slug text,
  add column if not exists description text not null default '',
  add column if not exists inventory integer;

update public.earning_tasks
set slug = lower(regexp_replace(coalesce(nullif(id, ''), 'task-' || substr(md5(random()::text),1,8)), '[^a-z0-9-]+', '-', 'g'))
where slug is null;
create unique index if not exists earning_tasks_slug_uidx on public.earning_tasks(slug);

alter table public.rewards
  add column if not exists slug text,
  add column if not exists inventory integer;
update public.rewards
set slug = lower(regexp_replace(coalesce(nullif(id, ''), 'reward-' || substr(md5(random()::text),1,8)), '[^a-z0-9-]+', '-', 'g'))
where slug is null;
create unique index if not exists rewards_slug_uidx on public.rewards(slug);

alter table public.points_ledger
  add column if not exists reason text not null default 'Legacy entry',
  add column if not exists source_type text not null default 'adjustment',
  add column if not exists source_id uuid,
  add column if not exists idempotency_key text;
update public.points_ledger set idempotency_key = 'legacy-' || id::text where idempotency_key is null;
alter table public.points_ledger alter column idempotency_key set not null;
create unique index if not exists points_ledger_user_idempotency_uidx on public.points_ledger(user_id, idempotency_key);
create index if not exists points_ledger_user_created_idx on public.points_ledger(user_id, created_at desc);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null references public.earning_tasks(id) on delete restrict,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 160),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (user_id, task_id),
  unique (user_id, idempotency_key)
);

alter table public.redemptions add column if not exists idempotency_key text;
update public.redemptions set idempotency_key = 'legacy-' || id::text where idempotency_key is null;
alter table public.redemptions alter column idempotency_key set not null;
create unique index if not exists redemptions_user_idempotency_uidx on public.redemptions(user_id, idempotency_key);
create index if not exists redemptions_user_created_idx on public.redemptions(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.earning_tasks enable row level security;
alter table public.rewards enable row level security;
alter table public.points_ledger enable row level security;
alter table public.task_completions enable row level security;
alter table public.redemptions enable row level security;

drop policy if exists task_completions_read_own on public.task_completions;
create policy task_completions_read_own on public.task_completions
  for select to authenticated using ((select auth.uid()) = user_id);

-- Existing starter policies remain in place. Client roles receive no policies to
-- create completions, award points, edit the ledger, or fulfil redemptions.
grant select, insert, update on public.profiles to authenticated;
grant select on public.earning_tasks, public.rewards to authenticated;
grant select on public.points_ledger, public.task_completions, public.redemptions to authenticated;
