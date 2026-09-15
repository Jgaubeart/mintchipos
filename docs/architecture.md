# Architecture and system boundaries

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, RLS, security-definer RPCs)
- Hermes runtime (async `/v1/runs`) with DeepSeek `deepseek-v4-pro`
- Vercel hosts the Next.js app; Railway hosts the Hermes runtime

## Boundaries

- MintChipOS is the authoritative control plane: projects, immutable artifact
  versions, agent definitions/versions/runs, approvals, and lineage.
- The Orchestrator remains the control plane; the Engineering Operator is a
  specialized worker that receives a controlled task envelope and never becomes
  a second independent control plane.
- Hermes/DeepSeek is only an execution runtime. A completed Hermes run is
  execution evidence, not permission to approve, overwrite, or deploy.
- Supabase is the durable system of record. Runtime state (e.g. the Hermes
  run id) is mirrored into `agent_runs` for traceability.

## Key directories

- `app/` — routes (login, dashboard, projects, artifacts, agents, runs, skills, tools)
- `lib/auth/` — Supabase SSR session handling and route protection
- `lib/supabase/` — server/browser clients and hand-maintained `database.types.ts`
- `lib/execution/` — runtime abstraction + Hermes adapter
  - `hermes/runtime.ts` — async run submission/polling and prompt assembly
  - `hermes/client.ts` — `/v1/runs` HTTP client
  - `execute.ts` — orchestration: load run, execute, normalize, validate, persist
  - `types.ts`, `prompt.ts`, `output.ts`, `schema.ts`, `validation.ts`, `failure.ts`
- `lib/projects/`, `lib/artifacts/`, `lib/agents/`, `lib/capabilities/` — domain queries/formatting
- `lib/engineering-operator/` — bounded engineering task intents, risk/approval
  policy, continuation planning, execution contract, and local runtime

## Domain tables

- `projects`, `artifacts`, `artifact_versions`
- `agent_definitions`, `agent_definition_versions`, `agent_runs`, `agent_run_artifacts`
- `skills`, `skill_versions`, `tools`, `agent_skills`, `agent_tools`
- `engineering_tasks`, `engineering_task_events`, `engineering_task_artifacts`

## Execution flow

1. A manual run is created `PENDING` with an `input_snapshot`.
2. `executeAgentRun` marks it `RUNNING`, then submits to Hermes.
3. On admission, the Hermes `run_id` is persisted via `set_agent_run_runtime`.
4. The runtime polls `GET /v1/runs/{id}` with a bounded timeout.
5. On completion, output is normalized (`normalizeStructuredOutput`), then
   validated against the agent version `output_schema` (if any).
6. For `RESEARCH_STRATEGIST`, the validated output is persisted as a versioned
   `RESEARCH` artifact with `OUTPUT` lineage.
7. The run is completed `SUCCEEDED`, or failed with a specific error code.

All writes go through security-definer RPCs; authenticated clients do not
directly update domain tables.
