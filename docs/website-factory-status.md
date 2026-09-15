# Website Factory status

Branch: `integration/website-factory`

## Status key

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETE`
- `BLOCKED`

## Components

| Component | Status | Verification | Live vs fixture |
| --- | --- | --- | --- |
| Completed workstream integration | COMPLETE | `npm run verify` passes after merge | Fixture |
| Factory domain contracts | COMPLETE | `tests/website-factory.test.ts` | Fixture |
| Business research provider | COMPLETE | Fixture + HTTP adapter implemented | Fixture-tested |
| Industry classification | COMPLETE | Fixture | Fixture |
| Playbook selection | COMPLETE | Fixture provider | Fixture |
| Auto Design Direction Brief | COMPLETE | `validateDesignBrief` in tests | Fixture |
| UX / content strategy | COMPLETE | Pipeline tests | Fixture |
| Asset audit / plan | COMPLETE | Pipeline tests | Fixture |
| Creative direction | COMPLETE | Pipeline tests | Fixture |
| Deterministic frontend builder | COMPLETE | Pipeline tests | Fixture |
| Functional QA | COMPLETE | Pipeline tests | Fixture |
| Visual QA | COMPLETE | Pipeline tests | Fixture |
| Bounded repair loop | COMPLETE | `RepairingBuilder` test | Fixture |
| Preview deployment boundary | COMPLETE | Mock provider test | Fixture |
| Live Vercel preview | BLOCKED | None | Not live-verified |
| Live business research crawl | BLOCKED | None | Not live-verified |

## Migrations

- `20260913120000_demo_deployments.sql` — integrated, not applied remotely.
- `20260913110000_prospecting.sql` — integrated, not applied remotely.
- `20260913130000_website_factory_runs.sql` — created, not applied remotely.

## Next action

Apply the migrations after dry-run review, configure Vercel preview access,
then run the first controlled live pilot through `/factory`.

## External access inspection

- GitHub: `gh auth status` reports the default `Jgaubeart` token is invalid.
  `git ls-remote origin HEAD` could not reach GitHub from this environment.
- Supabase: the local worktree is not linked to a project ref, so
  `supabase migration list` cannot read remote state without re-linking.
- Vercel: CLI is not installed and no MintChipOS token/project config is
  present. No live preview was created.
- Railway: CLI is not installed and no service/token state is present.

## First live pilot result

Run ID: `9aa5d0d7-6d8e-4a87-915c-fcbcf6967558`

Status: `READY_FOR_LIVE_VERIFICATION` with the frontend build stage blocked by
a repeated Hermes poll timeout. Completed live stages through
`CREATIVE_DIRECTION` and `ASSET_PLAN`; `FRONTEND_BUILD`, `FUNCTIONAL_QA`,
`VISUAL_QA`, and `PREVIEW_DEPLOYMENT` did not complete.

Hermes stages that completed:

- `DESIGN_BRIEF`: `deepseek-v4-pro`, input 21004, output 5361
- `UX_CONTENT_STRATEGY`: `deepseek-v4-pro`, input 21177, output 2886
- `CREATIVE_DIRECTION`: `deepseek-v4-pro`, input 23979, output 8873

No estimated cost was returned by Hermes for those runs.

Preview deployment is blocked by missing Vercel preview credentials.
