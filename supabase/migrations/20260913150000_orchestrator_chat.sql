-- MintChipOS operator Orchestrator chat foundation.
-- Internal authenticated operator conversations and linked tasks.

create table public.orchestrator_threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orchestrator_threads_owner_updated_idx
  on public.orchestrator_threads(owner_id, updated_at desc);

create table public.orchestrator_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.orchestrator_threads(id) on delete cascade,
  role text not null check (role in ('USER', 'ORCHESTRATOR', 'SYSTEM_EVENT')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index orchestrator_messages_thread_created_idx
  on public.orchestrator_messages(thread_id, created_at asc);

create table public.orchestrator_tasks (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.orchestrator_threads(id) on delete cascade,
  message_id uuid references public.orchestrator_messages(id) on delete set null,
  intent text not null,
  status text not null default 'QUEUED',
  project_id uuid references public.projects(id) on delete set null,
  factory_run_id uuid references public.website_factory_runs(id) on delete set null,
  deployment_id uuid references public.deployments(id) on delete set null,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint orchestrator_tasks_status_check check (
    status in (
      'QUEUED',
      'RUNNING',
      'WAITING_FOR_APPROVAL',
      'SUCCEEDED',
      'FAILED',
      'CANCELLED'
    )
  )
);

create index orchestrator_tasks_thread_updated_idx
  on public.orchestrator_tasks(thread_id, updated_at desc);
create index orchestrator_tasks_factory_run_idx
  on public.orchestrator_tasks(factory_run_id);

alter table public.orchestrator_threads enable row level security;
alter table public.orchestrator_messages enable row level security;
alter table public.orchestrator_tasks enable row level security;

create policy "Operator threads are readable by authenticated users"
  on public.orchestrator_threads for select to authenticated using (true);

create policy "Operator threads are insertable by owner"
  on public.orchestrator_threads for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Operator threads are updatable by owner"
  on public.orchestrator_threads for update to authenticated
  using (owner_id = auth.uid());

create policy "Operator messages are readable by authenticated users"
  on public.orchestrator_messages for select to authenticated using (true);

create policy "Operator messages are insertable by owner"
  on public.orchestrator_messages for insert to authenticated
  with check (
    exists (
      select 1
      from public.orchestrator_threads t
      where t.id = thread_id
        and t.owner_id = auth.uid()
    )
  );

create policy "Operator tasks are readable by authenticated users"
  on public.orchestrator_tasks for select to authenticated using (true);

create policy "Operator tasks are insertable by owner"
  on public.orchestrator_tasks for insert to authenticated
  with check (
    exists (
      select 1
      from public.orchestrator_threads t
      where t.id = thread_id
        and t.owner_id = auth.uid()
    )
  );

create policy "Operator tasks are updatable by owner"
  on public.orchestrator_tasks for update to authenticated
  using (
    exists (
      select 1
      from public.orchestrator_threads t
      where t.id = thread_id
        and t.owner_id = auth.uid()
    )
  );

