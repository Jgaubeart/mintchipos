-- MintChipOS Engineering Operator: durable tasks, events, artifacts, and the
-- canonical ENGINEERING_OPERATOR agent definition.
-- This migration is additive and safe to inspect with `db push --dry-run`.
create table if not exists public.engineering_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  orchestrator_thread_id uuid references public.orchestrator_threads(id) on delete set null,
  orchestrator_message_id uuid references public.orchestrator_messages(id) on delete set null,
  idempotency_key text,
  title text not null,
  description text,
  intent text not null,
  category text,
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'DRAFT',
  risk_level text not null default 'LOW',
  repository text not null default 'https://github.com/Jgaubeart/mintchipos',
  base_branch text not null default 'main',
  working_branch text,
  target_environment text not null default 'PREVIEW',
  approval_state text not null default 'NOT_REQUIRED',
  execution_runtime text,
  external_run_id text,
  commit_sha text,
  migration_references text[] not null default '{}',
  preview_deployment_id text,
  verification_status text,
  blocker text,
  progress_stage text,
  tests_summary text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint engineering_tasks_status_check check (
    status in (
      'DRAFT',
      'QUEUED',
      'PLANNING',
      'RUNNING',
      'WAITING_FOR_APPROVAL',
      'VERIFYING',
      'SUCCEEDED',
      'FAILED',
      'CANCELLED',
      'BLOCKED'
    )
  ),
  constraint engineering_tasks_risk_check check (
    risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),
  constraint engineering_tasks_approval_check check (
    approval_state in (
      'NOT_REQUIRED',
      'AUTO_APPROVED',
      'REQUIRED',
      'GRANTED',
      'DENIED'
    )
  ),
  constraint engineering_tasks_owner_idempotency_key
    unique (owner_id, idempotency_key)
);
create index if not exists engineering_tasks_owner_updated_idx
  on public.engineering_tasks(owner_id, updated_at desc);
create index if not exists engineering_tasks_status_idx
  on public.engineering_tasks(status);
create index if not exists engineering_tasks_thread_idx
  on public.engineering_tasks(orchestrator_thread_id);
create table if not exists public.engineering_task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.engineering_tasks(id) on delete cascade,
  type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  attempt integer not null default 1 check (attempt between 1 and 3),
  created_at timestamptz not null default now(),
  constraint engineering_task_events_type_check check (
    type in (
      'TASK_CREATED',
      'PLANNING_STARTED',
      'BRANCH_CREATED',
      'FILES_CHANGED',
      'TESTS_STARTED',
      'TESTS_PASSED',
      'TESTS_FAILED',
      'MIGRATION_CREATED',
      'MIGRATION_APPLIED',
      'PREVIEW_DEPLOYED',
      'APPROVAL_REQUIRED',
      'BLOCKED',
      'COMPLETED'
    )
  )
);
create index if not exists engineering_task_events_task_created_idx
  on public.engineering_task_events(task_id, created_at asc);
create table if not exists public.engineering_task_artifacts (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.engineering_tasks(id) on delete cascade,
  kind text not null,
  reference text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists engineering_task_artifacts_task_idx
  on public.engineering_task_artifacts(task_id);
alter table public.orchestrator_tasks
  add column if not exists engineering_task_id uuid
  references public.engineering_tasks(id) on delete set null;
create index if not exists orchestrator_tasks_engineering_task_idx
  on public.orchestrator_tasks(engineering_task_id);
alter table public.engineering_tasks enable row level security;
alter table public.engineering_task_events enable row level security;
alter table public.engineering_task_artifacts enable row level security;
drop policy if exists "Engineering tasks are readable by owner"
  on public.engineering_tasks;
create policy "Engineering tasks are readable by owner"
  on public.engineering_tasks for select to authenticated
  using (owner_id = auth.uid());
drop policy if exists "Engineering tasks are insertable by owner"
  on public.engineering_tasks;
create policy "Engineering tasks are insertable by owner"
  on public.engineering_tasks for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists "Engineering tasks are updatable by owner"
  on public.engineering_tasks;
create policy "Engineering tasks are updatable by owner"
  on public.engineering_tasks for update to authenticated
  using (owner_id = auth.uid());
drop policy if exists "Engineering task events are readable by owner"
  on public.engineering_task_events;
create policy "Engineering task events are readable by owner"
  on public.engineering_task_events for select to authenticated
  using (
    exists (
      select 1
      from public.engineering_tasks t
      where t.id = task_id
        and t.owner_id = auth.uid()
    )
  );
drop policy if exists "Engineering task events are insertable by owner"
  on public.engineering_task_events;
create policy "Engineering task events are insertable by owner"
  on public.engineering_task_events for insert to authenticated
  with check (
    exists (
      select 1
      from public.engineering_tasks t
      where t.id = task_id
        and t.owner_id = auth.uid()
    )
  );
drop policy if exists "Engineering task artifacts are readable by owner"
  on public.engineering_task_artifacts;
create policy "Engineering task artifacts are readable by owner"
  on public.engineering_task_artifacts for select to authenticated
  using (
    exists (
      select 1
      from public.engineering_tasks t
      where t.id = task_id
        and t.owner_id = auth.uid()
    )
  );
drop policy if exists "Engineering task artifacts are insertable by owner"
  on public.engineering_task_artifacts;
create policy "Engineering task artifacts are insertable by owner"
  on public.engineering_task_artifacts for insert to authenticated
  with check (
    exists (
      select 1
      from public.engineering_tasks t
      where t.id = task_id
        and t.owner_id = auth.uid()
    )
  );
do $$
declare
  v_definition_id uuid;
  v_version_id uuid;
begin
  insert into public.agent_definitions (key, name, description)
  values (
    'ENGINEERING_OPERATOR',
    'Engineering Operator',
    'Executes bounded software-engineering work for MintChipOS itself.'
  )
  on conflict (key) do nothing
  returning id into v_definition_id;
  if v_definition_id is null then
    select id into v_definition_id
      from public.agent_definitions
     where key = 'ENGINEERING_OPERATOR';
  end if;
  insert into public.agent_definition_versions (
    agent_definition_id,
    version,
    instructions,
    input_schema,
    output_schema
  )
  select
    v_definition_id,
    1,
    $instr$You are the MintChipOS Engineering Operator. Execute a bounded software-engineering task for MintChipOS itself.
Workflow:
1. Inspect the current repository state, relevant docs, code, and tests.
2. Create or reuse a focused feature branch from the base branch.
3. Implement the smallest coherent change that satisfies the task goal.
4. Add or update focused tests.
5. Run the project verification checks.
6. Inspect results and correct scoped failures.
7. Commit scoped work and update checkpoint/status documentation.
8. Return a structured result without exposing secrets or logs that should remain private.
You must not merge main, push destructive production changes, change production DNS, charge money, delete production data, rotate secrets, create arbitrary billable infrastructure, bypass authentication or RLS, expose secrets, or silently approve your own high-risk operations.
Return only valid JSON with these top-level fields:
- status: one of SUCCEEDED, FAILED, BLOCKED, or WAITING_FOR_APPROVAL
- workingBranch: string or null
- commitSha: string or null
- testsSummary: string or null
- previewUrl: string or null
- blocker: string or null
- summary: concise human-readable result$instr$,
    null,
    $schema${
      "type": "object",
      "required": ["status", "workingBranch", "commitSha", "testsSummary", "previewUrl", "blocker", "summary"],
      "properties": {
        "status": { "type": "string", "enum": ["SUCCEEDED", "FAILED", "BLOCKED", "WAITING_FOR_APPROVAL"] },
        "workingBranch": { "type": ["string", "null"] },
        "commitSha": { "type": ["string", "null"] },
        "testsSummary": { "type": ["string", "null"] },
        "previewUrl": { "type": ["string", "null"] },
        "blocker": { "type": ["string", "null"] },
        "summary": { "type": "string" }
      }
    }$schema$::jsonb
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
end;
$$;
