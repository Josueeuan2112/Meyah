-- Candidates must read jobs they applied to even after the job is closed,
-- expired, or soft-deleted. jobs_select_public_open only covers open/live
-- jobs and jobs_select_owner only covers the employer, so a candidate
-- loses the embedded job on every application to a non-open vacancy.
--
-- A naive inline policy referencing applications would cause mutual RLS
-- recursion (applications_select_involved already references jobs). A
-- SECURITY DEFINER helper reads applications with RLS bypassed but stays
-- scoped to auth.uid(), so it returns only a boolean about the caller.

create or replace function public.current_user_applied_to_job(p_job_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from applications a
    where a.job_id = p_job_id
      and a.candidato_id = auth.uid()
  );
$$;

grant execute on function public.current_user_applied_to_job(uuid) to authenticated;

create policy jobs_select_applicant
on jobs
for select
to authenticated
using ( public.current_user_applied_to_job(jobs.id) );
