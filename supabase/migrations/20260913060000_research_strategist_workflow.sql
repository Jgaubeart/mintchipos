-- Research Strategist workflow foundation:
-- 1) give RESEARCH_STRATEGIST a real version with instructions and output schema
-- 2) add an idempotent RPC to persist an agent's output as a versioned artifact
--    with OUTPUT lineage.

do $$
declare
  v_definition_id uuid;
  v_version_id uuid;
begin
  select id into v_definition_id
    from public.agent_definitions
   where key = 'RESEARCH_STRATEGIST';

  if v_definition_id is null then
    raise exception 'Research Strategist definition not found';
  end if;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    output_schema
  )
  select
    v_definition_id,
    2,
    E'You are the Research Strategist for MintChipOS. You analyze the current project and produce an initial, structured research foundation for downstream UX, content, creative, and build agents.\n\nWork strictly from the project context and the user request provided in this run. No web or browser research is available yet, so do not claim external research occurred and do not invent facts.\n\nDistinguish clearly between known facts (explicitly stated in the provided context) and assumptions (reasonable inferences that are not yet confirmed).\n\nKeep the output actionable, concise, and directly usable by downstream agents.\n\nReturn only the structured object matching your output schema. Do not include extra commentary or markdown around the JSON.',
    '{"type":"object","required":["executive_summary","business_context","research_questions","known_facts","assumptions","opportunities","risks","recommended_next_steps"],"properties":{"executive_summary":{"type":"string"},"business_context":{"type":"object","required":["business_name","project_goal","target_customer"],"properties":{"business_name":{"type":"string"},"project_goal":{"type":"string"},"target_customer":{"type":"string"}}},"research_questions":{"type":"array","items":{"type":"string"}},"known_facts":{"type":"array","items":{"type":"string"}},"assumptions":{"type":"array","items":{"type":"string"}},"opportunities":{"type":"array","items":{"type":"string"}},"risks":{"type":"array","items":{"type":"string"}},"recommended_next_steps":{"type":"array","items":{"type":"string"}}}}'::jsonb
  where not exists (
    select 1
    from public.agent_definition_versions
   where agent_definition_id = v_definition_id
     and version = 2
  )
  returning id into v_version_id;

  if v_version_id is not null then
    update public.agent_definitions
       set current_version_id = v_version_id,
           updated_at = now()
     where id = v_definition_id;
  end if;
end;
$$;

create or replace function public.persist_agent_output_artifact(
  p_project_id uuid,
  p_agent_run_id uuid,
  p_artifact_type text,
  p_title text,
  p_content text,
  p_structured_data jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_artifact_id uuid;
  v_version_id uuid;
  v_existing_version_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.agent_runs
   where id = p_agent_run_id
     and project_id = p_project_id
  ) then
    raise exception 'Run not found for project';
  end if;

  -- Idempotency: never write the same run's output twice.
  select ara.artifact_version_id
    into v_existing_version_id
    from public.agent_run_artifacts ara
   where ara.agent_run_id = p_agent_run_id
     and ara.relationship = 'OUTPUT'
   limit 1;

  if v_existing_version_id is not null then
    return v_existing_version_id;
  end if;

  select id into v_artifact_id
    from public.artifacts
   where project_id = p_project_id
     and artifact_type = p_artifact_type
   limit 1
   for update;

  if not found then
    insert into public.artifacts (
      project_id,
      artifact_type,
      title,
      status,
      created_by
    ) values (
      p_project_id,
      p_artifact_type,
      p_title,
      'DRAFT',
      auth.uid()
    )
    returning id into v_artifact_id;
  end if;

  insert into public.artifact_versions (
    artifact_id,
    version,
    content,
    structured_data,
    created_by_type,
    created_by_user_id,
    created_by_agent_run_id
  )
  select
    v_artifact_id,
    coalesce(max(version), 0) + 1,
    p_content,
    p_structured_data,
    'AGENT',
    auth.uid(),
    p_agent_run_id
  from public.artifact_versions
  where artifact_id = v_artifact_id
  returning id into v_version_id;

  update public.artifacts
     set current_version_id = v_version_id,
         updated_at = now()
   where id = v_artifact_id;

  insert into public.agent_run_artifacts (
    agent_run_id,
    artifact_version_id,
    relationship
  ) values (
    p_agent_run_id,
    v_version_id,
    'OUTPUT'
  );

  return v_version_id;
end;
$$;

grant execute on function public.persist_agent_output_artifact(
  uuid, uuid, text, text, text, jsonb
) to authenticated;
