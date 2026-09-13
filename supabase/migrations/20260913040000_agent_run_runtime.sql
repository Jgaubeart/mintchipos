-- Generic runtime fields for AgentRun execution.

alter table public.agent_runs
  add column if not exists runtime_provider text,
  add column if not exists runtime_run_id text;

create index if not exists agent_runs_runtime_provider_idx
  on public.agent_runs(runtime_provider);

create or replace function public.mark_agent_run_running(
  p_agent_run_id uuid
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
     set status = 'RUNNING',
         started_at = now()
   where id = p_agent_run_id
     and status = 'PENDING';

  if not found then
    raise exception 'Run is not pending';
  end if;
end;
$$;

grant execute on function public.mark_agent_run_running(uuid) to authenticated;

create or replace function public.complete_agent_run_success(
  p_agent_run_id uuid,
  p_output_snapshot jsonb,
  p_model_provider text,
  p_model_name text,
  p_model_policy_key text,
  p_runtime_provider text,
  p_runtime_run_id text,
  p_duration_ms bigint,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_estimated_cost_usd numeric
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
     set status = 'SUCCEEDED',
         output_snapshot = p_output_snapshot,
         model_provider = p_model_provider,
         model_name = p_model_name,
         model_policy_key = p_model_policy_key,
         runtime_provider = p_runtime_provider,
         runtime_run_id = p_runtime_run_id,
         duration_ms = p_duration_ms,
         input_tokens = p_input_tokens,
         output_tokens = p_output_tokens,
         estimated_cost_usd = p_estimated_cost_usd,
         completed_at = now(),
         error_code = null,
         error_message = null
   where id = p_agent_run_id;

  if not found then
    raise exception 'Run not found';
  end if;
end;
$$;

grant execute on function public.complete_agent_run_success(
  uuid, jsonb, text, text, text, text, text, bigint, bigint, bigint, numeric
) to authenticated;

create or replace function public.fail_agent_run(
  p_agent_run_id uuid,
  p_error_code text,
  p_error_message text,
  p_runtime_provider text default null,
  p_runtime_run_id text default null
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
     set status = 'FAILED',
         completed_at = now(),
         error_code = p_error_code,
         error_message = p_error_message,
         runtime_provider = coalesce(p_runtime_provider, runtime_provider),
         runtime_run_id = coalesce(p_runtime_run_id, runtime_run_id)
   where id = p_agent_run_id;

  if not found then
    raise exception 'Run not found';
  end if;
end;
$$;

grant execute on function public.fail_agent_run(
  uuid, text, text, text, text
) to authenticated;
