# Prospecting architecture

This parallel workstream (`workstream-prospecting-foundation`) adds the
prospect discovery and qualification foundation only. It does not implement
outreach, website generation, demos, payments, or deployment.

## Domain modules

- `lib/prospecting/types.ts` — canonical prospect, scan, provider, website,
  contact, and qualification contracts.
- `lib/prospecting/constants.ts` — statuses, score thresholds, weights, and
  bounded crawl defaults.
- `lib/prospecting/normalize.ts` — deterministic candidate normalization and
  duplicate fingerprint construction.
- `lib/prospecting/dedupe.ts` — domain/name/phone/address duplicate detection.
- `lib/prospecting/website.ts` — bounded, deterministic HTML inspection.
- `lib/prospecting/contact.ts` — public-website contact extraction only.
- `lib/prospecting/scoring.ts` — V1 deterministic qualification rubric.
- `lib/prospecting/providers.ts` — discovery-provider abstraction and the
  fixture provider.
- `lib/prospecting/orchestrator.ts` — scan pipeline: discover, normalize,
  dedupe, inspect, contact, score.
- `lib/prospecting/queries.ts` — Supabase persistence and reads.
- `lib/prospecting/run-scan.ts` — server-side scan execution and persistence.

## Data model

The dedicated `prospect_scans` and `prospects` tables are created by
`supabase/migrations/20260913110000_prospecting.sql`. Project artifact tables
are not overloaded for this domain.

`prospects` stores identity, discovery provenance, business signals, website
signals, contact signals, and qualification outputs. Missing values are
represented as `null` or empty arrays; the system does not invent data.

## Pipeline

1. Operator creates a scan with location, industries, and maximum prospects.
2. A discovery provider returns normalized candidate businesses.
3. Candidates are normalized and deduplicated.
4. Website URLs are inspected with hard page/request/time/byte limits.
5. Public contact data is extracted only from already-discovered data.
6. The deterministic rubric scores and qualifies each prospect.
7. Results are persisted against the scan and become available in the UI.

## Cost policy

No paid model calls, embeddings, vector databases, or agent frameworks are
added. Discovery and qualification are deterministic code paths.

## Status

- Implemented: data model, scan model, providers, website inspection,
  qualification rubric, contact boundary, UI routes, tests, migration file.
- Fixture-tested: the full discovery/qualification path.
- Live-verified: no live discovery or live website crawl has been run because
  no authorized live provider is configured.

