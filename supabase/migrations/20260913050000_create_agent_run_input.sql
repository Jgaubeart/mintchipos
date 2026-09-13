-- Allow manual test runs to persist a user input snapshot.

drop function if exists public.create_agent_run(uuid, uuid, text, text);

create or replace function public.create_agent_run(
  p_project_id uuid,
  p_agent_definition_id uuid,
  p_trigger_reason text default null,
  p_workflow_stage text default null,
  p_input_snapshot jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version_id uuid;
  v_run_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select current_version_id into v_version_id
    from public.agent_definitions
   where id = p_agent_definition_id
   for update;

  if not found then
    raise exception 'Agent definition not found';
  end if;

  if v_version_id is null then
    raise exception 'Agent definition has no current version';
  end if;

  insert into public.agent_runs (
    project_id,
    agent_definition_id,
    agent_definition_version_id,
    trigger_type,
    trigger_reason,
    workflow_stage,
    input_snapshot,
    status,
    retry_count,
    created_by
  ) values (
    p_project_id,
    p_agent_definition_id,
    v_version_id,
    'MANUAL',
    p_trigger_reason,
    p_workflow_stage,
    p_input_snapshot,
    'PENDING',
    0,
    auth.uid()
  )
  returning id into v_run_id;

  return v_run_id;
end;
$$;

grant execute on function public.create_agent_run(
  uuid, uuid, text, text, jsonb
) to authenticated;
