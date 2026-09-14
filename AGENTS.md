<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MintChipOS operating notes

MintChipOS is an internal Next.js + Supabase control plane for website
production. It owns projects, immutable artifact versions, agent
definitions/runs, and approvals. Hermes/DeepSeek is the execution runtime; it
proposes results, and MintChipOS records the authoritative outcome.

Read only the runbook relevant to the current task:

- docs/architecture.md — system boundaries and data flow
- docs/current-work.md — active work order, acceptance criteria, evidence
- docs/testing.md — lint/typecheck/test/build and local acceptance checks
- docs/supabase-migrations.md — inspecting and applying migrations
- docs/deployment.md — Railway/Hermes and Vercel deploy + log access
- docs/known-issues.md — confirmed problems and proven fixes

Operating rules:

- Work on a dedicated branch. Do not push to main or trigger production
  deploys without explicit approval.
- Do not apply remote migrations, rotate secrets, or create billable
  resources without approval.
- Never write secrets or credentials into repository files.
- Bound automatic repair to three attempts for the same failure, then stop
  and report the evidence and actual blocker.
