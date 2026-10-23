-- Perkly company and survey-network collaboration intake.
create table if not exists public.partner_requests (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  website text,
  collaboration_type text not null check (collaboration_type in ('survey_network','research_campaign','other')),
  estimated_monthly_responses text,
  budget_range text,
  message text not null,
  status text not null default 'new' check (status in ('new','reviewing','contacted','accepted','declined')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.partner_requests enable row level security;
revoke all on public.partner_requests from public, anon, authenticated;
drop policy if exists partner_requests_admin_read on public.partner_requests;
create policy partner_requests_admin_read on public.partner_requests
for select to authenticated
using ((select coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '')) = 'admin');
create or replace function public.submit_partner_request(
  p_company_name text, p_contact_name text, p_contact_email text, p_website text,
  p_collaboration_type text, p_estimated_monthly_responses text, p_budget_range text, p_message text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_id uuid; v_email text := lower(trim(coalesce(p_contact_email, '')));
begin
  if length(trim(coalesce(p_company_name, ''))) not between 2 and 120 then raise exception 'Enter a company or organisation name (2–120 characters).'; end if;
  if length(trim(coalesce(p_contact_name, ''))) not between 2 and 100 then raise exception 'Enter a contact name (2–100 characters).'; end if;
  if length(v_email) not between 6 and 254 or v_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_{}|~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$' then raise exception 'Enter a valid contact email address.'; end if;
  if p_collaboration_type not in ('survey_network','research_campaign','other') then raise exception 'Choose a valid collaboration type.'; end if;
  if length(trim(coalesce(p_message, ''))) not between 20 and 3000 then raise exception 'Tell us a little more (20–3000 characters).'; end if;
  if length(trim(coalesce(p_website, ''))) > 300 or length(trim(coalesce(p_estimated_monthly_responses, ''))) > 100 or length(trim(coalesce(p_budget_range, ''))) > 100 then raise exception 'One of the optional fields is too long.'; end if;
  if exists (select 1 from public.partner_requests where contact_email = v_email and created_at > now() - interval '15 minutes') then raise exception 'A recent request from this email is already recorded. Please wait before sending another.'; end if;
  insert into public.partner_requests(company_name,contact_name,contact_email,website,collaboration_type,estimated_monthly_responses,budget_range,message)
  values(trim(p_company_name),trim(p_contact_name),v_email,nullif(trim(coalesce(p_website,'')),''),p_collaboration_type,nullif(trim(coalesce(p_estimated_monthly_responses,'')),''),nullif(trim(coalesce(p_budget_range,'')),''),trim(p_message))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.submit_partner_request(text,text,text,text,text,text,text,text) from public;
grant execute on function public.submit_partner_request(text,text,text,text,text,text,text,text) to anon, authenticated;
create or replace function public.review_partner_request(p_request_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then raise exception 'Administrator access required.'; end if;
  if p_status not in ('reviewing','contacted','accepted','declined') then raise exception 'Choose a valid review status.'; end if;
  update public.partner_requests set status = p_status, reviewed_at = now() where id = p_request_id;
  if not found then raise exception 'Partner request not found.'; end if;
end;
$$;
revoke all on function public.review_partner_request(uuid,text) from public, anon;
grant execute on function public.review_partner_request(uuid,text) to authenticated;
