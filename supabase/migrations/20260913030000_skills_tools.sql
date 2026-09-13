-- Skills, skill versions, tools, and agent capability assignments.
-- Safe to rerun after partial execution.

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_versions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  version integer not null check (version > 0),
  instructions text not null,
  metadata jsonb,
  source_type text check (source_type in ('INTERNAL', 'EXTERNAL', 'DERIVED')),
  source_reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint skill_versions_skill_version_key unique (skill_id, version)
);

create index if not exists skill_versions_skill_id_idx
  on public.skill_versions(skill_id);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  risk_level text not null check (
    risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),
  execution_category text,
  configuration_schema jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_skills (
  id uuid primary key default gen_random_uuid(),
  agent_definition_id uuid not null references public.agent_definitions(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  required boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint agent_skills_agent_skill_key unique (agent_definition_id, skill_id)
);

create index if not exists agent_skills_agent_definition_id_idx
  on public.agent_skills(agent_definition_id);

create table if not exists public.agent_tools (
  id uuid primary key default gen_random_uuid(),
  agent_definition_id uuid not null references public.agent_definitions(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  permission_level text not null check (
    permission_level in ('READ', 'EXECUTE', 'MUTATE', 'DEPLOY')
  ),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint agent_tools_agent_tool_key unique (agent_definition_id, tool_id)
);

create index if not exists agent_tools_agent_definition_id_idx
  on public.agent_tools(agent_definition_id);

alter table public.skills
  add column if not exists current_version_id uuid references public.skill_versions(id) on delete set null;

create index if not exists skills_current_version_id_idx
  on public.skills(current_version_id);

create or replace function public.validate_skill_current_version()
returns trigger
language plpgsql
as $$
begin
  if new.current_version_id is not null then
    if not exists (
      select 1
      from public.skill_versions v
      where v.id = new.current_version_id
        and v.skill_id = new.id
    ) then
      raise exception 'current_version_id must belong to the same skill';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_skill_current_version_trigger
  on public.skills;

create trigger validate_skill_current_version_trigger
before insert or update on public.skills
for each row execute function public.validate_skill_current_version();

alter table public.skills enable row level security;
alter table public.skill_versions enable row level security;
alter table public.tools enable row level security;
alter table public.agent_skills enable row level security;
alter table public.agent_tools enable row level security;

drop policy if exists "Skills are readable by authenticated users" on public.skills;
create policy "Skills are readable by authenticated users"
on public.skills for select to authenticated using (true);

drop policy if exists "Skill versions are readable by authenticated users" on public.skill_versions;
create policy "Skill versions are readable by authenticated users"
on public.skill_versions for select to authenticated using (true);

drop policy if exists "Tools are readable by authenticated users" on public.tools;
create policy "Tools are readable by authenticated users"
on public.tools for select to authenticated using (true);

drop policy if exists "Agent skills are readable by authenticated users" on public.agent_skills;
create policy "Agent skills are readable by authenticated users"
on public.agent_skills for select to authenticated using (true);

drop policy if exists "Agent tools are readable by authenticated users" on public.agent_tools;
create policy "Agent tools are readable by authenticated users"
on public.agent_tools for select to authenticated using (true);

create or replace function public.create_skill(
  p_key text,
  p_name text,
  p_instructions text,
  p_description text default null,
  p_source_type text default null,
  p_source_reference text default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_skill_id uuid;
  v_version_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.skills (key, name, description)
  values (p_key, p_name, p_description)
  returning id into v_skill_id;

  insert into public.skill_versions (
    skill_id,
    version,
    instructions,
    metadata,
    source_type,
    source_reference,
    created_by
  ) values (
    v_skill_id,
    1,
    p_instructions,
    p_metadata,
    p_source_type,
    p_source_reference,
    auth.uid()
  )
  returning id into v_version_id;

  update public.skills
     set current_version_id = v_version_id,
         updated_at = now()
   where id = v_skill_id;

  return v_skill_id;
end;
$$;

grant execute on function public.create_skill(
  text, text, text, text, text, text, jsonb
) to authenticated;

create or replace function public.add_skill_version(
  p_skill_id uuid,
  p_instructions text,
  p_source_type text default null,
  p_source_reference text default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_skill_id uuid;
  v_next_version integer;
  v_version_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_skill_id
    from public.skills
   where id = p_skill_id
   for update;

  if not found then
    raise exception 'Skill not found';
  end if;

  select coalesce(max(version), 0) + 1
    into v_next_version
    from public.skill_versions
   where skill_id = p_skill_id;

  insert into public.skill_versions (
    skill_id,
    version,
    instructions,
    metadata,
    source_type,
    source_reference,
    created_by
  ) values (
    p_skill_id,
    v_next_version,
    p_instructions,
    p_metadata,
    p_source_type,
    p_source_reference,
    auth.uid()
  )
  returning id into v_version_id;

  update public.skills
     set current_version_id = v_version_id,
         updated_at = now()
   where id = p_skill_id;

  return v_version_id;
end;
$$;

grant execute on function public.add_skill_version(
  uuid, text, text, text, jsonb
) to authenticated;

create or replace function public.update_skill(
  p_skill_id uuid,
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

  update public.skills
     set name = p_name,
         description = p_description,
         active = p_active,
         updated_at = now()
   where id = p_skill_id;

  if not found then
    raise exception 'Skill not found';
  end if;
end;
$$;

grant execute on function public.update_skill(uuid, text, text, boolean) to authenticated;

create or replace function public.assign_skill_to_agent(
  p_agent_definition_id uuid,
  p_skill_id uuid,
  p_required boolean default false,
  p_enabled boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.agent_skills (
    agent_definition_id,
    skill_id,
    required,
    enabled
  ) values (
    p_agent_definition_id,
    p_skill_id,
    p_required,
    p_enabled
  )
  on conflict (agent_definition_id, skill_id) do update
    set required = excluded.required,
        enabled = excluded.enabled
  returning id into v_assignment_id;

  return v_assignment_id;
end;
$$;

grant execute on function public.assign_skill_to_agent(
  uuid, uuid, boolean, boolean
) to authenticated;

create or replace function public.set_agent_skill_enabled(
  p_agent_skill_id uuid,
  p_enabled boolean
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

  update public.agent_skills
     set enabled = p_enabled
   where id = p_agent_skill_id;

  if not found then
    raise exception 'Skill assignment not found';
  end if;
end;
$$;

grant execute on function public.set_agent_skill_enabled(uuid, boolean) to authenticated;

create or replace function public.remove_agent_skill(
  p_agent_skill_id uuid
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

  delete from public.agent_skills
   where id = p_agent_skill_id;

  if not found then
    raise exception 'Skill assignment not found';
  end if;
end;
$$;

grant execute on function public.remove_agent_skill(uuid) to authenticated;

create or replace function public.assign_tool_to_agent(
  p_agent_definition_id uuid,
  p_tool_id uuid,
  p_permission_level text,
  p_enabled boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.agent_tools (
    agent_definition_id,
    tool_id,
    permission_level,
    enabled
  ) values (
    p_agent_definition_id,
    p_tool_id,
    p_permission_level,
    p_enabled
  )
  on conflict (agent_definition_id, tool_id) do update
    set permission_level = excluded.permission_level,
        enabled = excluded.enabled
  returning id into v_assignment_id;

  return v_assignment_id;
end;
$$;

grant execute on function public.assign_tool_to_agent(
  uuid, uuid, text, boolean
) to authenticated;

create or replace function public.set_agent_tool_enabled(
  p_agent_tool_id uuid,
  p_enabled boolean
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

  update public.agent_tools
     set enabled = p_enabled
   where id = p_agent_tool_id;

  if not found then
    raise exception 'Tool assignment not found';
  end if;
end;
$$;

grant execute on function public.set_agent_tool_enabled(uuid, boolean) to authenticated;

create or replace function public.remove_agent_tool(
  p_agent_tool_id uuid
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

  delete from public.agent_tools
   where id = p_agent_tool_id;

  if not found then
    raise exception 'Tool assignment not found';
  end if;
end;
$$;

grant execute on function public.remove_agent_tool(uuid) to authenticated;

do $$
declare
  seed record;
  v_skill_id uuid;
  v_version_id uuid;
begin
  for seed in
    select * from (values
      ('BUSINESS_RESEARCH', 'Business Research', 'Research market and business context.', 'Placeholder instructions for Business Research.'),
      ('WEBSITE_AUDIT', 'Website Audit', 'Audit website structure, content, and performance.', 'Placeholder instructions for Website Audit.'),
      ('CREATIVE_DIRECTOR', 'Creative Director', 'Direct creative and brand output.', 'Placeholder instructions for Creative Director.'),
      ('TASTE', 'Taste', 'Evaluate aesthetic and brand quality.', 'Placeholder instructions for Taste.'),
      ('UX_CONVERSION', 'UX / Conversion', 'Improve UX and conversion performance.', 'Placeholder instructions for UX / Conversion.'),
      ('FRONTEND_BUILD', 'Frontend Build', 'Build frontend project output.', 'Placeholder instructions for Frontend Build.'),
      ('VISUAL_QA', 'Visual QA', 'Review visual implementation quality.', 'Placeholder instructions for Visual QA.'),
      ('FUNCTIONAL_QA', 'Functional QA', 'Review functional implementation quality.', 'Placeholder instructions for Functional QA.')
    ) as t(key, name, description, instructions)
  loop
    insert into public.skills (key, name, description)
    values (seed.key, seed.name, seed.description)
    on conflict (key) do nothing
    returning id into v_skill_id;

    if v_skill_id is null then
      select id into v_skill_id
        from public.skills
       where key = seed.key;
    end if;

    insert into public.skill_versions (
      skill_id,
      version,
      instructions,
      source_type
    )
    select v_skill_id, 1, seed.instructions, 'INTERNAL'
    where not exists (
      select 1
      from public.skill_versions
      where skill_id = v_skill_id
        and version = 1
    )
    returning id into v_version_id;

    if v_version_id is not null then
      update public.skills
         set current_version_id = v_version_id,
             updated_at = now()
       where id = v_skill_id;
    end if;
  end loop;
end;
$$;

insert into public.tools (key, name, description, risk_level, execution_category)
values
  ('WEB_SEARCH', 'Web Search', 'Search the web for information.', 'LOW', 'SEARCH'),
  ('BROWSER_INSPECT', 'Browser Inspect', 'Inspect live web pages.', 'MEDIUM', 'BROWSER'),
  ('BROWSER_SCREENSHOT', 'Browser Screenshot', 'Capture live web page screenshots.', 'MEDIUM', 'BROWSER'),
  ('GITHUB_READ', 'GitHub Read', 'Read repository content.', 'MEDIUM', 'GITHUB'),
  ('GITHUB_WRITE', 'GitHub Write', 'Mutate repository content.', 'HIGH', 'GITHUB'),
  ('VERCEL_PREVIEW', 'Vercel Preview', 'Create preview deployments.', 'MEDIUM', 'VERCEL'),
  ('VERCEL_DEPLOY', 'Vercel Deploy', 'Create production deployments.', 'CRITICAL', 'VERCEL'),
  ('IMAGE_GENERATION', 'Image Generation', 'Generate raster image assets.', 'MEDIUM', 'IMAGE')
on conflict (key) do nothing;

do $$
begin
  insert into public.agent_skills (agent_definition_id, skill_id, required)
  select a.id, s.id, false
  from public.agent_definitions a
  join public.skills s on true
  where (a.key, s.key) in (
    ('RESEARCH_STRATEGIST', 'BUSINESS_RESEARCH'),
    ('RESEARCH_STRATEGIST', 'WEBSITE_AUDIT'),
    ('CREATIVE_DIRECTOR', 'CREATIVE_DIRECTOR'),
    ('CREATIVE_DIRECTOR', 'TASTE'),
    ('UX_CONTENT_STRATEGIST', 'UX_CONVERSION'),
    ('UX_CONTENT_STRATEGIST', 'WEBSITE_AUDIT'),
    ('FRONTEND_BUILDER', 'FRONTEND_BUILD'),
    ('VISUAL_QA', 'VISUAL_QA'),
    ('VISUAL_QA', 'TASTE'),
    ('FUNCTIONAL_QA', 'FUNCTIONAL_QA')
  )
  on conflict (agent_definition_id, skill_id) do nothing;

  insert into public.agent_tools (agent_definition_id, tool_id, permission_level)
  select a.id, t.id, v.permission_level
  from public.agent_definitions a
  join public.tools t on true
  join (values
    ('RESEARCH_STRATEGIST', 'WEB_SEARCH', 'READ'),
    ('RESEARCH_STRATEGIST', 'BROWSER_INSPECT', 'EXECUTE'),
    ('RESEARCH_STRATEGIST', 'BROWSER_SCREENSHOT', 'EXECUTE'),
    ('CREATIVE_DIRECTOR', 'BROWSER_INSPECT', 'EXECUTE'),
    ('CREATIVE_DIRECTOR', 'BROWSER_SCREENSHOT', 'EXECUTE'),
    ('CREATIVE_DIRECTOR', 'IMAGE_GENERATION', 'EXECUTE'),
    ('UX_CONTENT_STRATEGIST', 'WEB_SEARCH', 'READ'),
    ('UX_CONTENT_STRATEGIST', 'BROWSER_INSPECT', 'EXECUTE'),
    ('FRONTEND_BUILDER', 'GITHUB_READ', 'READ'),
    ('FRONTEND_BUILDER', 'GITHUB_WRITE', 'MUTATE'),
    ('FRONTEND_BUILDER', 'VERCEL_PREVIEW', 'EXECUTE'),
    ('VISUAL_QA', 'BROWSER_INSPECT', 'EXECUTE'),
    ('VISUAL_QA', 'BROWSER_SCREENSHOT', 'EXECUTE'),
    ('FUNCTIONAL_QA', 'BROWSER_INSPECT', 'EXECUTE')
  ) as v(agent_key, tool_key, permission_level)
    on v.agent_key = a.key and v.tool_key = t.key
  on conflict (agent_definition_id, tool_id) do nothing;
end;
$$;
