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

