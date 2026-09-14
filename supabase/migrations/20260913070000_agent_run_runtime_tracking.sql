-- Persist the external runtime run id as soon as Hermes admits a run,
-- so timed-out or long-running runs remain traceable.

create or replace function public.set_agent_run_runtime(
  p_agent_run_id uuid,
  p_runtime_provider text,
  p_runtime_run_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.agent_runs
     set runtime_provider = p_runtime_provider,
         runtime_run_id = p_runtime_run_id
   where id = p_agent_run_id;

  if not found then
    raise exception 'Run not found';
  end if;
end;
$$;

grant execute on function public.set_agent_run_runtime(
  uuid, text, text
) to authenticated;
