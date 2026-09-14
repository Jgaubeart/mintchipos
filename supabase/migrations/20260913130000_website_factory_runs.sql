-- MintChipOS Website Factory run ledger.
-- Records orchestration progress without replacing the canonical artifact,
-- agent-run, or deployment tables.

create table public.website_factory_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  website_url text not null,
  business_name text,
  status text not null default 'NOT_STARTED',
  current_stage text,
  progress integer not null default 0,
  stages jsonb not null default '[]'::jsonb,
  artifacts jsonb not null default '[]'::jsonb,
  preview_url text,
  provider_deployment_id text,
  failure_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint website_factory_runs_status_check check (
    status in (
      'NOT_STARTED',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'READY_FOR_LIVE_VERIFICATION'
    )
  ),
  constraint website_factory_runs_progress_check check (
    progress between 0 and 100
  )
);

create index website_factory_runs_project_id_idx
  on public.website_factory_runs(project_id, created_at desc);
create index website_factory_runs_status_idx
  on public.website_factory_runs(status);

alter table public.website_factory_runs enable row level security;

create policy "Website factory runs are readable by authenticated users"
  on public.website_factory_runs for select to authenticated using (true);

create policy "Website factory runs are insertable by authenticated users"
  on public.website_factory_runs for insert to authenticated with check (true);

create policy "Website factory runs are updatable by authenticated users"
  on public.website_factory_runs for update to authenticated using (true);

