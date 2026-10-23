create or replace function public.get_my_points_balance()
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance bigint;
begin
  if v_user_id is null then raise exception 'Sign in is required'; end if;
  select coalesce(sum(l.amount), 0) into v_balance
  from public.points_ledger l where l.user_id = v_user_id;
  return v_balance;
end;
$$;
revoke all on function public.get_my_points_balance() from public, anon;
grant execute on function public.get_my_points_balance() to authenticated;
