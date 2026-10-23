-- Perkly secure earn/redeem RPCs.
-- All point-changing operations run transactionally in PostgreSQL; demo rewards are requests only.
create or replace function public.submit_task_completion(p_task_id text, p_idempotency_key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_completion_id uuid;
begin
  if v_user_id is null then raise exception 'Sign in is required'; end if;
  if p_task_id is null or length(trim(p_task_id)) = 0 then raise exception 'Task is required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 160 then
    raise exception 'Invalid request key';
  end if;
  if not exists (select 1 from public.earning_tasks t where t.id = p_task_id and t.active = true) then
    raise exception 'Task is not available';
  end if;

  insert into public.task_completions(user_id, task_id, idempotency_key, status)
  values (v_user_id, p_task_id, p_idempotency_key, 'pending')
  returning id into v_completion_id;
  return v_completion_id;
exception
  when unique_violation then
    select tc.id into v_completion_id
    from public.task_completions tc
    where tc.user_id = v_user_id and (tc.task_id = p_task_id or tc.idempotency_key = p_idempotency_key)
    limit 1;
    if v_completion_id is not null then return v_completion_id; end if;
    raise;
end;
$$;

create or replace function public.review_task_completion(p_completion_id uuid, p_approve boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completion public.task_completions%rowtype;
  v_points integer;
  v_task_title text;
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required';
  end if;
  select * into v_completion from public.task_completions where id = p_completion_id for update;
  if not found then raise exception 'Completion not found'; end if;
  if v_completion.status <> 'pending' then
    if (v_completion.status = 'approved' and p_approve) or (v_completion.status = 'rejected' and not p_approve) then
      return v_completion.status;
    end if;
    raise exception 'Completion has already been reviewed';
  end if;

  if p_approve then
    select t.points, t.title into v_points, v_task_title
    from public.earning_tasks t where t.id = v_completion.task_id and t.active = true;
    if not found then raise exception 'Task is no longer active'; end if;
    insert into public.points_ledger(user_id, amount, entry_type, reference_id, description, reason, source_type, source_id, idempotency_key)
    values (v_completion.user_id, v_points, 'task_credit', v_completion.task_id,
            'Approved task: ' || v_task_title, 'Approved task completion', 'task_completion', v_completion.id,
            'task-completion:' || v_completion.id::text);
    update public.task_completions set status = 'approved', reviewed_at = now() where id = v_completion.id;
    return 'approved';
  else
    update public.task_completions set status = 'rejected', reviewed_at = now() where id = v_completion.id;
    return 'rejected';
  end if;
end;
$$;

create or replace function public.redeem_reward(p_reward_id text, p_idempotency_key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_redemption_id uuid;
  v_existing public.redemptions%rowtype;
  v_balance bigint;
begin
  if v_user_id is null then raise exception 'Sign in is required'; end if;
  if p_reward_id is null or length(trim(p_reward_id)) = 0 then raise exception 'Reward is required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 160 then
    raise exception 'Invalid request key';
  end if;

  select * into v_existing from public.redemptions
  where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.reward_id <> p_reward_id then raise exception 'Request key already used for another reward'; end if;
    return v_existing.id;
  end if;

  select * into v_reward from public.rewards where id = p_reward_id and active = true for update;
  if not found then raise exception 'Reward is not available'; end if;
  if v_reward.inventory is not null and v_reward.inventory <= 0 then raise exception 'Reward is out of stock'; end if;

  select coalesce(sum(l.amount), 0) into v_balance
  from public.points_ledger l where l.user_id = v_user_id;
  if v_balance < v_reward.points_cost then raise exception 'Not enough points'; end if;

  insert into public.redemptions(user_id, reward_id, points_cost, status, idempotency_key)
  values (v_user_id, v_reward.id, v_reward.points_cost, 'requested', p_idempotency_key)
  returning id into v_redemption_id;

  insert into public.points_ledger(user_id, amount, entry_type, reference_id, description, reason, source_type, source_id, idempotency_key)
  values (v_user_id, -v_reward.points_cost, 'redemption_debit', v_redemption_id::text,
          'Reward request: ' || v_reward.title, 'Reward redemption request', 'redemption', v_redemption_id,
          'redemption:' || v_user_id::text || ':' || p_idempotency_key);

  if v_reward.inventory is not null then
    update public.rewards set inventory = inventory - 1 where id = v_reward.id and inventory > 0;
    if not found then raise exception 'Reward is out of stock'; end if;
  end if;
  return v_redemption_id;
end;
$$;

revoke all on function public.submit_task_completion(text, text) from public, anon;
revoke all on function public.review_task_completion(uuid, boolean) from public, anon, authenticated;
revoke all on function public.redeem_reward(text, text) from public, anon;
grant execute on function public.submit_task_completion(text, text) to authenticated;
grant execute on function public.review_task_completion(uuid, boolean) to authenticated;
grant execute on function public.redeem_reward(text, text) to authenticated;
