-- MintChipOS demo staging / deployment foundation.
-- This migration supports PREVIEW deployments only. Production deployment is
-- intentionally modeled but must not be enabled by this workstream.

create table public.deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  prospect_id uuid,
  deployment_type text not null default 'PREVIEW',
  status text not null default 'PENDING',
  provider text not null default 'MOCK',
  provider_deployment_id text,
  preview_url text,
  preview_hostname text,
  preview_visibility text not null default 'UNLISTED',
  source_artifact_id uuid,
  source_artifact_type text,
  source_commit text,
  build_id text,
  version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  is_current boolean not null default false,
  failure_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deployed_at timestamptz,
  failed_at timestamptz,
  superseded_at timestamptz,
  constraint deployments_type_check check (
    deployment_type in ('PREVIEW', 'PRODUCTION')
  ),
  constraint deployments_status_check check (
    status in ('PENDING', 'BUILDING', 'READY', 'FAILED', 'ARCHIVED')
  ),
  constraint deployments_provider_check check (
    provider in ('MOCK', 'VERCEL')
  ),
  constraint deployments_preview_visibility_check check (
    preview_visibility in ('PUBLIC_DEMO', 'UNLISTED', 'PASSWORD_PROTECTED')
  ),
  constraint deployments_version_check check (version > 0),
  constraint deployments_project_type_version_key unique (
    project_id,
    deployment_type,
    version
  )
);

create index deployments_project_id_idx
  on public.deployments(project_id, deployment_type);
create index deployments_current_idx
  on public.deployments(project_id, deployment_type, is_current);
create index deployments_provider_deployment_id_idx
  on public.deployments(provider_deployment_id);

alter table public.deployments enable row level security;

create policy "Deployments are readable by authenticated users"
  on public.deployments for select to authenticated using (true);

create policy "Deployments are insertable by authenticated users"
  on public.deployments for insert to authenticated with check (true);

create policy "Deployments are updatable by authenticated users"
  on public.deployments for update to authenticated using (true);

