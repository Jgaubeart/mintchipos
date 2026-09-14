# Supabase migrations

## Where they live

`supabase/migrations/` — one SQL file per change, ordered by timestamp.

## Project

- Linked project ref: `prabxmwligbxzcrdmqhq`
- CLI is available via `npx supabase` (pinned in `devDependencies`)

## Commands

```bash
npx supabase migration list          # read-only: local vs remote
npx supabase db push --dry-run       # show what would be applied
npx supabase db push                 # apply pending migrations
```

Always run `--dry-run` first and review the output before pushing.

## Important reconciliation note

The remote migration history table was historically empty even though schema
objects existed from manual SQL Editor runs. If `db push --dry-run` lists many
old migrations, do not blind-push. Confirm the schema objects already exist,
then reconcile history with:

```bash
npx supabase migration repair --status applied <version...>
```

Only then push the genuinely new migration.

## TypeScript types

`lib/supabase/database.types.ts` is hand-maintained with domain-constant
imports and named exports. Do NOT overwrite it with `supabase gen types`;
instead update the affected type manually and verify against
`npx supabase gen types typescript --project-id prabxmwligbxzcrdmqhq --schema public`.
