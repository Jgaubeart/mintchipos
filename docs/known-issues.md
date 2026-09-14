# Confirmed problems and proven fixes

## Hermes returns structured output as JSON text

Problem: `OUTPUT_VALIDATION_FAILED: Expected an object value.`

Fix: `normalizeStructuredOutput(output, outputSchema)` parses JSON text and
Markdown-fenced JSON before validation (`lib/execution/output.ts`).

## Hermes returns its own field names instead of the schema

Problem: model emits `project`, `research_gaps`, `downstream_guidance`, etc.
instead of the canonical schema.

Fix: schema-constrained agents get an `OUTPUT REQUIREMENTS` section appended to
the Hermes `instructions` (generic, from `request.outputSchema`). Research
Strategist version 3 also names the exact fields. MintChipOS validates but
never guesses semantic mappings.

## Runs time out at 60s

Problem: `Hermes run … timed out after 60000ms.`

Fix: default 180s, Research Strategist 300s via `executionTimeoutMs`. Local
poll timeout maps to `HERMES_POLL_TIMEOUT` (distinct from Hermes `failed`) and
keeps `runtime_run_id`; the error notes the remote run may still be active.

## runtime_run_id only persisted at terminal state

Fix: `set_agent_run_runtime` RPC persists the admitted Hermes run id as early
as practical (`lib/execution/execute.ts` `onRuntimeRunId`).

## Manual run had no input

Problem: `No user message found in input`.

Fix: `create_agent_run` accepts `p_input_snapshot`; the Create Test Run form
collects required input.

## Legacy acknowledgement validation rejected generic outputs

Fix: generic `validateAgentOutput(output, outputSchema?)`; only runs with an
explicit schema are structure-validated.

## Migration history empty while schema objects already exist

Do not blind `db push`. Confirm objects exist, reconcile with
`migration repair --status applied`, then push only the new migration.
