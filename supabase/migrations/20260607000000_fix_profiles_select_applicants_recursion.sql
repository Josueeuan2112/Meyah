-- profiles_select_applicants referenced applications inline, and
-- applications_insert_own references profiles (the tipo='candidato' check).
-- An INSERT into applications expands applications -> profiles -> applications,
-- which Postgres flags as "infinite recursion detected in policy for relation
-- applications". Break the cycle like jobs_select_applicant: move the cross-table
-- check into a SECURITY DEFINER function so the policy no longer references
-- applications. Behaviour is preserved: an employer sees the profile of a
-- candidate who applied to one of their jobs, and no one else.

create or replace function public.current_user_can_view_applicant(p_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from applications a
    join jobs j on j.id = a.job_id
    join companies c on c.id = j.company_id
    where a.candidato_id = p_profile_id
      and c.owner_id = auth.uid()
  );
$$;

grant execute on function public.current_user_can_view_applicant(uuid) to authenticated;

drop policy if exists profiles_select_applicants on profiles;

create policy profiles_select_applicants
on profiles
for select
to authenticated
using (
  deleted_at is null
  and public.current_user_can_view_applicant(profiles.id)
);