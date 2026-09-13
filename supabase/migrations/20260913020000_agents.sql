-- Agent definitions, definition versions, runs, and run-artifact lineage.

create table public.agent_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_definition_versions (
  id uuid primary key default gen_random_uuid(),
  agent_definition_id uuid not null references public.agent_definitions(id) on delete cascade,
  version integer not null check (version > 0),
  instructions text not null,
  input_schema jsonb,
  output_schema jsonb,
  quality_rubric jsonb,
  permission_config jsonb,
  model_policy_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_definition_versions_definition_version_key
    unique (agent_definition_id, version)
);

create index agent_definition_versions_definition_id_idx
  on public.agent_definition_versions(agent_definition_id);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  agent_definition_id uuid not null references public.agent_definitions(id) on delete cascade,
  agent_definition_version_id uuid not null references public.agent_definition_versions(id) on delete cascade,
  trigger_type text not null check (
    trigger_type in ('MANUAL', 'WORKFLOW', 'RETRY', 'SYSTEM')
  ),
  trigger_reason text,
  workflow_stage text,
  status text not null default 'PENDING' check (
    status in ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')
  ),
  model_provider text,
  model_name text,
  model_policy_key text,
  input_snapshot jsonb,
  output_snapshot jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms bigint,
  input_tokens bigint,
  output_tokens bigint,
  estimated_cost_usd numeric,
  retry_count integer not null default 0,
  error_code text,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index agent_runs_project_id_idx on public.agent_runs(project_id);
create index agent_runs_agent_definition_id_idx on public.agent_runs(agent_definition_id);
create index agent_runs_status_idx on public.agent_runs(status);

create table public.agent_run_artifacts (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  artifact_version_id uuid not null references public.artifact_versions(id) on delete cascade,
  relationship text not null check (
    relationship in ('INPUT', 'OUTPUT', 'REFERENCE')
  ),
  created_at timestamptz not null default now(),
  constraint agent_run_artifacts_unique_lineage
    unique (agent_run_id, artifact_version_id, relationship)
);

create index agent_run_artifacts_run_id_idx on public.agent_run_artifacts(agent_run_id);
create index agent_run_artifacts_artifact_version_id_idx
  on public.agent_run_artifacts(artifact_version_id);

alter table public.agent_definitions
  add column current_version_id uuid references public.agent_definition_versions(id) on delete set null;

create index agent_definitions_current_version_id_idx
  on public.agent_definitions(current_version_id);

create or replace function public.validate_agent_definition_current_version()
returns trigger
language plpgsql
as $$
begin
  if new.current_version_id is not null then
    if not exists (
      select 1
      from public.agent_definition_versions v
      where v.id = new.current_version_id
        and v.agent_definition_id = new.id
    ) then
      raise exception 'current_version_id must belong to the same agent definition';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_agent_definition_current_version_trigger
before insert or update on public.agent_definitions
for each row execute function public.validate_agent_definition_current_version();

alter table public.agent_definitions enable row level security;
alter table public.agent_definition_versions enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_run_artifacts enable row level security;

create policy "Agent definitions are readable by authenticated users"
on public.agent_definitions for select to authenticated using (true);

create policy "Agent definition versions are readable by authenticated users"
on public.agent_definition_versions for select to authenticated using (true);

create policy "Agent runs are readable by authenticated users"
on public.agent_runs for select to authenticated using (true);

create policy "Agent run artifacts are readable by authenticated users"
on public.agent_run_artifacts for select to authenticated using (true);

create or replace function public.create_agent_definition(
  p_key text,
  p_name text,
  p_description text default null,
  p_instructions text,
  p_input_schema jsonb default null,
  p_output_schema jsonb default null,
  p_quality_rubric jsonb default null,
  p_permission_config jsonb default null,
  p_model_policy_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_definition_id uuid;
  v_version_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.agent_definitions (key, name, description)
  values (p_key, p_name, p_description)
  returning id into v_definition_id;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    input_schema,
    output_schema,
    quality_rubric,
    permission_config,
    model_policy_key,
    created_by
  ) values (
    v_definition_id,
    1,
    p_instructions,
    p_input_schema,
    p_output_schema,
    p_quality_rubric,
    p_permission_config,
    p_model_policy_key,
    auth.uid()
  )
  returning id into v_version_id;

  update public.agent_definitions
     set current_version_id = v_version_id,
         updated_at = now()
   where id = v_definition_id;

  return v_definition_id;
end;
$$;

grant execute on function public.create_agent_definition(
  text, text, text, text, jsonb, jsonb, jsonb, jsonb, text
) to authenticated;

create or replace function public.add_agent_definition_version(
  p_agent_definition_id uuid,
  p_instructions text,
  p_input_schema jsonb default null,
  p_output_schema jsonb default null,
  p_quality_rubric jsonb default null,
  p_permission_config jsonb default null,
  p_model_policy_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_definition_id uuid;
  v_next_version integer;
  v_version_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_definition_id
    from public.agent_definitions
   where id = p_agent_definition_id
   for update;

  if not found then
    raise exception 'Agent definition not found';
  end if;

  select coalesce(max(version), 0) + 1
    into v_next_version
    from public.agent_definition_versions
   where agent_definition_id = p_agent_definition_id;

  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    input_schema,
    output_schema,
    quality_rubric,
    permission_config,
    model_policy_key,
    created_by
  ) values (
    p_agent_definition_id,
    v_next_version,
    p_instructions,
    p_input_schema,
    p_output_schema,
    p_quality_rubric,
    p_permission_config,
    p_model_policy_key,
    auth.uid()
  )
  returning id into v_version_id;

  update public.agent_definitions
     set current_version_id = v_version_id,
         updated_at = now()
   where id = p_agent_definition_id;

  return v_version_id;
end;
$$;

grant execute on function public.add_agent_definition_version(
  uuid, text, jsonb, jsonb, jsonb, jsonb, text
) to authenticated;

create or replace function public.update_agent_definition(
  p_agent_definition_id uuid,
  p_name text,
  p_description text default null,
  p_active boolean default true
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

  update public.agent_definitions
     set name = p_name,
         description = p_description,
         active = p_active,
         updated_at = now()
   where id = p_agent_definition_id;

  if not found then
    raise exception 'Agent definition not found';
  end if;
end;
$$;

grant execute on function public.update_agent_definition(
  uuid, text, text, boolean
) to authenticated;

create or replace function public.create_agent_run(
  p_project_id uuid,
  p_agent_definition_id uuid,
  p_trigger_reason text default null,
  p_workflow_stage text default null
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
    'PENDING',
    0,
    auth.uid()
  )
  returning id into v_run_id;

  return v_run_id;
end;
$$;

grant execute on function public.create_agent_run(
  uuid, uuid, text, text
) to authenticated;

create or replace function public.add_agent_run_artifact(
  p_agent_run_id uuid,
  p_artifact_version_id uuid,
  p_relationship text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lineage_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.agent_run_artifacts (
    agent_run_id,
    artifact_version_id,
    relationship
  ) values (
    p_agent_run_id,
    p_artifact_version_id,
    p_relationship
  )
  returning id into v_lineage_id;

  return v_lineage_id;
end;
$$;

grant execute on function public.add_agent_run_artifact(
  uuid, uuid, text
) to authenticated;

do $$
declare
  seed record;
  v_definition_id uuid;
  v_version_id uuid;
begin
  for seed in
    select * from (values
      ('ORCHESTRATOR', 'Orchestrator', 'Coordinates project work across specialized agents.', 'Placeholder instructions for the Orchestrator.'),
      ('RESEARCH_STRATEGIST', 'Research Strategist', 'Plans and structures project research.', 'Placeholder instructions for the Research Strategist.'),
      ('UX_CONTENT_STRATEGIST', 'UX / Content Strategist', 'Defines UX and content strategy.', 'Placeholder instructions for the UX / Content Strategist.'),
      ('CREATIVE_DIRECTOR', 'Creative Director', 'Directs creative and brand output.', 'Placeholder instructions for the Creative Director.'),
      ('FRONTEND_BUILDER', 'Frontend Builder', 'Builds frontend project output.', 'Placeholder instructions for the Frontend Builder.'),
      ('VISUAL_QA', 'Visual QA', 'Reviews visual implementation quality.', 'Placeholder instructions for Visual QA.'),
      ('FUNCTIONAL_QA', 'Functional QA', 'Reviews functional implementation quality.', 'Placeholder instructions for Functional QA.')
    ) as t(key, name, description, instructions)
  loop
    insert into public.agent_definitions (key, name, description)
    values (seed.key, seed.name, seed.description)
    on conflict (key) do nothing
    returning id into v_definition_id;

    if v_definition_id is null then
      select id into v_definition_id
        from public.agent_definitions
       where key = seed.key;
    end if;

    insert into public.agent_definition_versions (
      agent_definition_id,
      version,
      instructions
    )
    select v_definition_id, 1, seed.instructions
    where not exists (
      select 1
      from public.agent_definition_versions
      where agent_definition_id = v_definition_id
        and version = 1
    )
    returning id into v_version_id;

    if v_version_id is not null then
      update public.agent_definitions
         set current_version_id = v_version_id,
             updated_at = now()
       where id = v_definition_id;
    end if;
  end loop;
end;
$$;
