-- Merge own-row and admin reads into one policy, and cache JWT role evaluation per statement.
drop policy if exists task_completions_admin_read on public.task_completions;
drop policy if exists task_completions_read_own on public.task_completions;
create policy task_completions_read_own on public.task_completions
for select to authenticated
using (
  (select auth.uid()) = user_id
  or (select coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '')) = 'admin'
);
