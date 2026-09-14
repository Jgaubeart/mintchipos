# Current work and acceptance criteria

## Active work order: Engineering Operator Bootstrap

Reference: `MintChipOS_Acceleration_Review.md` (Work Package A).

### Objective

Set up this coding environment so the operator can inspect, implement, test,
and troubleshoot MintChipOS without the owner relaying prompts, deployment
logs, or SQL by hand.

### Acceptance criteria

- Reads the repository, branch/status, and the persistent project instructions.
- Reads a deployment/log and the Supabase migration list directly.
- Implements a scoped change on a branch, runs checks, and produces a preview
  with evidence.
- Fixes one controlled failing test within an explicit attempt/time budget.
- Stops at production deployment, destructive migration, or new-secret
  authorization boundaries.
- Records the outcome and produces one owner-facing summary.

### Working branch

`operator-bootstrap` (do not push to `main` or trigger production deploys).

### Evidence (operator bootstrap)

- GitHub: `git ls-remote origin HEAD` succeeded (HEAD `a33b6f5…`). `gh` CLI
  token is currently invalid and needs re-authentication.
- Supabase CLI: `npx supabase migration list` succeeded (project
  `prabxmwligbxzcrdmqhq`, all 9 migrations applied).
- Railway/Vercel: CLIs are not installed and no tokens are present locally;
  see `docs/deployment.md`.

### Verification evidence

`npm run verify` passes end to end: lint, typecheck, 46/46 tests, and the
Next.js production build.

### Controlled failure demonstration

A temporary `tests/controlled-failure.test.ts` asserting `1 + 1 === 3` failed
under `npm test` (`2 !== 3`), then was removed; the suite is green again. No
deliberately broken code remains.

### Stop boundaries

- No push to `main`.
- No production deployment, remote migration, secret rotation, or billable
  resource creation without explicit approval.
- Automatic repair is limited to three attempts for the same failure.
