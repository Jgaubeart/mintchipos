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

## Milestone 1: Design Direction Brief v1

Branch: `milestone-1-design-brief`.

### Scope

Add the first production workflow artifact `DESIGN_DIRECTION_BRIEF`: a
structured, versioned brief describing what a website should look like, feel
like, communicate, and accomplish.

### Architecture decisions

- Reuse the existing `artifacts` + `artifact_versions` model. The full brief is
  stored in `artifact_versions.structured_data` (jsonb) and the deterministic
  human summary in `content`.
- `schemaVersion: 1` and `source` (`OWNER_MINT_CHIP` / `CUSTOMER` / `AGENT`)
  are stored inside the brief for versioning and provenance.
- Editing creates a new artifact version (never overwrites history).
- Authenticity rules are immutable domain constants surfaced in the UI; they
  are not user-disableable fields.

### Acceptance criteria

- Guided 10-step editor (Business → Goals → Brand → Visual Style → Colors &
  Type → Inspiration → Assets → Content & Structure → Conversion → Review).
- Local autosave draft + explicit save that creates a versioned artifact.
- Deterministic review summary derived from structured values.
- Schema/enum/range validation with tests.

### Verification evidence

`npm run verify` passes: lint, typecheck, 54/54 tests, production build.
New routes build cleanly: `/projects/[slug]/design-brief` and
`/projects/[slug]/design-brief/edit`.

### Known limitations

- Migration `20260913090000_design_direction_brief.sql` is created but not yet
  applied to the live Supabase database (requires explicit approval).
- The brief editor draft autosave is local-only (browser `localStorage`); it
  is not a durable server draft.
- No upload/storage system for reference images yet; inspiration stores URLs
  and structured metadata so uploads can be added later.
- No live website-generation run and no paid model calls were performed.
