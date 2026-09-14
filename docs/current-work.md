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

### Milestone 1.1: Site Format

- Added `siteFormat` (`ONE_PAGE` / `FIVE_PAGE`) to the Design Direction Brief
  schema and editor.
- The UI lives in Content & Structure: a One Page / Five Pages toggle with
  selectable suggested sections/pages plus custom items.
- Schema keeps `schemaVersion: 1` (additive change); missing `siteFormat` is
  normalized to the default ONE_PAGE on load for backward compatibility.
- No database migration required (stored in `structured_data` jsonb).

## Milestone 2: Playbook Brief + Industry Playbook Generator

Branch: `milestone-2-playbooks`.

### Scope

Define, research, generate, and version reusable industry website playbooks
via the existing Research Strategist + artifact architecture. No website
generation yet.

### Architecture decisions

- `PLAYBOOK_BRIEF` and `INDUSTRY_PLAYBOOK` are versioned artifacts
  (`artifacts` + `artifact_versions`), stored as `structured_data` jsonb.
- The brief is a compact research spec (industry, target market, research
  scope, research questions, evidence requirements).
- The playbook uses a canonical 28-section structured schema plus
  `schemaVersion` and `industryName`.
- Playbook research runs are detected from `agent_runs.input_snapshot` with
  `kind: "PLAYBOOK_RESEARCH"`; the execution orchestrator switches to the
  `INDUSTRY_PLAYBOOK` output schema and persists `INDUSTRY_PLAYBOOK` on
  success.
- Lineage: `PLAYBOOK_BRIEF` (input snapshot) → agent run → `INDUSTRY_PLAYBOOK`
  artifact version (output).

### Acceptance criteria

- Create/edit a Playbook Brief; run Research Strategist; validate against the
  canonical playbook schema; persist a versioned `INDUSTRY_PLAYBOOK`; show
  sources and version history; no arbitrary field renaming.

### Verification evidence

`npm run verify` passes: lint, typecheck, 70/70 tests, production build.
Routes `/playbooks`, `/playbooks/new`, `/playbooks/[id]` build cleanly.

### Known limitations

- Migration `20260913100000_playbooks.sql` is created but not yet applied to
  the live Supabase database (requires explicit approval).
- The Playbook Brief UI is intentionally minimal; editing re-runs the brief as
  a new artifact version.
- No paid model research was executed during implementation.

## Parallel Workstream P2: Demo Staging Foundation

Branch: `workstream-demo-staging` (based on `milestone-1-design-brief` at
`d859884`). This runs in parallel with Milestone 2 and P1 without modifying
their workflows.

### Scope

Adds a deployment/preview domain model, provider boundary, deterministic
preview naming, version lineage, safe lifecycle, and internal deployment UI.
Only `PREVIEW` staging behavior is implemented.

### Key decisions

- Dedicated `deployments` table; no generator or outreach code is added.
- Provider abstraction keeps the domain model Vercel-compatible but not
  Vercel-coupled.
- Preview URLs are deterministic and collision-safe.
- Old previews are preserved and marked superseded, never auto-deleted.

### Evidence

Run `npm run verify`. See `docs/demo-staging.md`.

### Known limitations

- Migration `20260913120000_demo_deployments.sql` is created but not applied
  to the live Supabase database (requires explicit approval).
- No live Vercel verification was performed; Vercel CLI and credentials are
  not available in this environment.

## Parallel Workstream P1: Autonomous Prospecting Foundation

Branch: `workstream-prospecting-foundation` (based on `milestone-1-design-brief`
at `d859884`). This runs in parallel with Milestone 2 and does not modify
Milestone 2 files.

### Scope

Adds prospect discovery and qualification only: canonical prospect and scan
models, a discovery-provider boundary, bounded website inspection, a
deterministic V1 qualification rubric, duplicate prevention, contact-discovery
safety, and an operational internal UI.

### Key decisions

- Dedicated `prospect_scans` and `prospects` tables; project artifacts are not
  overloaded.
- Fixture discovery provider is the default. No live provider is authorized
  yet, and no live crawl or paid model call is performed.
- Qualification is deterministic and stores reasons alongside scores.
- Email discovery only surfaces already-public addresses and never guesses.

### Evidence

Run `npm run verify`. See `docs/prospecting-architecture.md`,
`docs/prospecting-qualification-rubric.md`,
`docs/prospecting-provider-interfaces.md`, and
`docs/prospecting-integration-boundary.md`.

### Known limitations

- Migration `20260913110000_prospecting.sql` is created but not applied to the
  live Supabase database (requires explicit approval).
- The scan UI uses fixture data until a live provider is authorized.
