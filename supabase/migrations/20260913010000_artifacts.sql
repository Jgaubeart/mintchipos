-- Project artifacts and immutable version history.

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  artifact_type text not null,
  title text not null,
  status text not null default 'DRAFT',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artifacts_project_artifact_type_key unique (project_id, artifact_type),
  constraint artifacts_status_check check (
    status in ('DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'SUPERSEDED', 'ARCHIVED')
  ),
  constraint artifacts_artifact_type_check check (
    artifact_type in (
      'BRIEF',
      'RESEARCH',
      'WEBSITE_AUDIT',
      'POSITIONING',
      'BRAND_DIRECTION',
      'UX_ARCHITECTURE',
      'COPY',
      'CREATIVE_DIRECTION',
      'INTERACTION_SPEC',
      'BUILD_PLAN',
      'VISUAL_QA',
      'FUNCTIONAL_QA',
      'LAUNCH_INFO'
    )
  )
);

create index artifacts_project_id_idx on public.artifacts(project_id);

create table public.artifact_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  version integer not null check (version > 0),
  content text not null,
  structured_data jsonb,
  created_by_type text not null default 'USER' check (
    created_by_type in ('USER', 'AGENT', 'SYSTEM')
  ),
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_agent_run_id uuid,
  created_at timestamptz not null default now(),
  constraint artifact_versions_artifact_version_key unique (artifact_id, version)
);

create index artifact_versions_artifact_id_idx on public.artifact_versions(artifact_id);

alter table public.artifacts
  add column current_version_id uuid references public.artifact_versions(id) on delete set null;

create index artifacts_current_version_id_idx on public.artifacts(current_version_id);

create or replace function public.validate_artifact_current_version()
returns trigger
language plpgsql
as $$
begin
  if new.current_version_id is not null then
    if not exists (
      select 1
      from public.artifact_versions v
      where v.id = new.current_version_id
        and v.artifact_id = new.id
    ) then
      raise exception 'current_version_id must belong to the same artifact';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_artifact_current_version_trigger
before insert or update on public.artifacts
for each row execute function public.validate_artifact_current_version();

alter table public.artifacts enable row level security;
alter table public.artifact_versions enable row level security;

create policy "Artifacts are readable by authenticated users"
on public.artifacts for select to authenticated using (true);

create policy "Artifact versions are readable by authenticated users"
on public.artifact_versions for select to authenticated using (true);

create or replace function public.create_artifact(
  p_project_id uuid,
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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

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

  insert into public.artifact_versions (
    artifact_id,
    version,
    content,
    structured_data,
    created_by_type,
    created_by_user_id
  ) values (
    v_artifact_id,
    1,
    p_content,
    p_structured_data,
    'USER',
    auth.uid()
  )
  returning id into v_version_id;

  update public.artifacts
     set current_version_id = v_version_id,
         updated_at = now()
   where id = v_artifact_id;

  return v_artifact_id;
end;
$$;

grant execute on function public.create_artifact(uuid, text, text, text, jsonb) to authenticated;

create or replace function public.add_artifact_version(
  p_artifact_id uuid,
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
  v_next_version integer;
  v_version_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_artifact_id
    from public.artifacts
   where id = p_artifact_id
   for update;

  if not found then
    raise exception 'Artifact not found';
  end if;

  select coalesce(max(version), 0) + 1
    into v_next_version
    from public.artifact_versions
   where artifact_id = p_artifact_id;

  insert into public.artifact_versions (
    artifact_id,
    version,
    content,
    structured_data,
    created_by_type,
    created_by_user_id
  ) values (
    p_artifact_id,
    v_next_version,
    p_content,
    p_structured_data,
    'USER',
    auth.uid()
  )
  returning id into v_version_id;

  update public.artifacts
     set current_version_id = v_version_id,
         updated_at = now()
   where id = p_artifact_id;

  return v_version_id;
end;
$$;

grant execute on function public.add_artifact_version(uuid, text, jsonb) to authenticated;

create or replace function public.update_artifact_metadata(
  p_artifact_id uuid,
  p_title text,
  p_status text
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

  update public.artifacts
     set title = p_title,
         status = p_status,
         updated_at = now()
   where id = p_artifact_id;

  if not found then
    raise exception 'Artifact not found';
  end if;
end;
$$;

grant execute on function public.update_artifact_metadata(uuid, text, text) to authenticated;
