-- Create a private profile row automatically for each newly registered auth user.
-- Uses a fixed search_path and limited metadata to avoid privilege/search-path issues.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 60);
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(requested_name, ''), 'Member'))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
