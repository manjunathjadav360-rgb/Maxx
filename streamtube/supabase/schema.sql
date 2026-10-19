-- VYBE / StreamTube starter schema for Supabase Postgres
-- Run this in Supabase SQL Editor. Review policies before production use.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'VYBE Creator',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  category text not null default 'Other',
  video_url text not null,
  storage_path text,
  thumbnail_url text,
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  views bigint not null default 0 check (views >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (subscriber_id, creator_id),
  check (subscriber_id <> creator_id)
);

create index if not exists videos_created_at_idx on public.videos (created_at desc);
create index if not exists videos_category_created_at_idx on public.videos (category, created_at desc);
create index if not exists videos_user_id_idx on public.videos (user_id);
create index if not exists comments_video_created_idx on public.comments (video_id, created_at desc);
create index if not exists likes_video_idx on public.likes (video_id);

-- Create a profile for each new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'creator'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Row-level security: public content can be read; writes are owner-scoped.
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Profiles are viewable" on public.profiles;
create policy "Profiles are viewable" on public.profiles for select using (true);
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Public videos are viewable" on public.videos;
create policy "Public videos are viewable" on public.videos for select using (visibility = 'public' or auth.uid() = user_id);
drop policy if exists "Signed-in users can upload videos" on public.videos;
create policy "Signed-in users can upload videos" on public.videos for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners update videos" on public.videos;
create policy "Owners update videos" on public.videos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Owners delete videos" on public.videos;
create policy "Owners delete videos" on public.videos for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Likes are viewable" on public.likes;
create policy "Likes are viewable" on public.likes for select using (true);
drop policy if exists "Users like as themselves" on public.likes;
create policy "Users like as themselves" on public.likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users remove own likes" on public.likes;
create policy "Users remove own likes" on public.likes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Comments are viewable" on public.comments;
create policy "Comments are viewable" on public.comments for select using (true);
drop policy if exists "Signed-in users add comments" on public.comments;
create policy "Signed-in users add comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own comments" on public.comments;
create policy "Users update own comments" on public.comments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete own comments" on public.comments;
create policy "Users delete own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Subscriptions are viewable by involved user" on public.subscriptions;
create policy "Subscriptions are viewable by involved user" on public.subscriptions for select to authenticated using (auth.uid() = subscriber_id or auth.uid() = creator_id);
drop policy if exists "Users subscribe as themselves" on public.subscriptions;
create policy "Users subscribe as themselves" on public.subscriptions for insert to authenticated with check (auth.uid() = subscriber_id);
drop policy if exists "Users remove own subscriptions" on public.subscriptions;
create policy "Users remove own subscriptions" on public.subscriptions for delete to authenticated using (auth.uid() = subscriber_id);

-- Video storage:
-- In Supabase Dashboard > Storage, create a PUBLIC bucket named "videos".
-- Then apply these storage policies. The first folder in each object path must be the uploader's auth UUID.
drop policy if exists "Public can view video objects" on storage.objects;
create policy "Public can view video objects" on storage.objects for select using (bucket_id = 'videos');
drop policy if exists "Users upload into own video folder" on storage.objects;
create policy "Users upload into own video folder" on storage.objects for insert to authenticated with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own video objects" on storage.objects;
create policy "Users update own video objects" on storage.objects for update to authenticated using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own video objects" on storage.objects;
create policy "Users delete own video objects" on storage.objects for delete to authenticated using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Production TODO: secure view counting with a database function, add rate limits/moderation,
-- thumbnail processing, upload-size limits, abuse reporting, and private/unlisted signed URLs.

-- Atomically increment views without allowing browsers to set arbitrary counts.
create or replace function public.increment_video_view(video_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.videos
  set views = views + 1
  where id = video_id and visibility = 'public';
end;
$$;
revoke all on function public.increment_video_view(uuid) from public;
grant execute on function public.increment_video_view(uuid) to anon, authenticated;

