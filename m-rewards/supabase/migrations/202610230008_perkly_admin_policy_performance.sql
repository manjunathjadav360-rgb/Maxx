-- Improve the admin task-completion read policy without re-evaluating auth.jwt() per row.
drop policy if exists task_completions_admin_read on public.task_completions;
create policy task_completions_admin_read on public.task_completions
for select to authenticated
using ((select coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '')) = 'admin');
