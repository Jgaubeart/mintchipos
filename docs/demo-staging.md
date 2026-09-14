# Demo staging foundation

This parallel workstream (`workstream-demo-staging`) adds the staging and
deployment domain only. It does not implement website generation, outreach,
billing, or production deployment.

## Preview architecture

The durable system of record is the `deployments` table. A deployment is
forward-compatible with both `PREVIEW` and `PRODUCTION`, but only `PREVIEW`
behavior is implemented in this workstream.

Deployment records link to an existing MintChipOS `project` and optionally to
a future `prospect`, source artifact, source commit, and build identifier.
The provider deployment ID and preview URL are recorded separately so the
provider can change without rewriting lineage.

## Deployment provider boundary

`DemoDeploymentProvider` defines:

- `createPreview(...)`
- `getDeploymentStatus(...)`
- `getDeploymentLogs(...)`
- `archivePreview(...)`

The domain model does not depend on Vercel. `MockDemoDeploymentProvider` is
the deterministic test provider. `VercelDemoDeploymentProvider` is a
Vercel-shaped adapter that requires `VERCEL_TOKEN` and `VERCEL_PROJECT_ID`.

## Naming rules

Preview slugs are generated in `lib/demo-staging/naming.ts`:

- lowercase
- normalized to `[a-z0-9-]`
- max 40 characters before the collision hash
- append an 8-character FNV-1a hash of normalized name, project ID, and
  prospect ID
- append `-vN` for versions greater than 1
- hostname pattern: `<slug>.preview.mintchipweb.com`

The hash avoids duplicate-business-name collisions. The project ID makes the
slug stable across renames without mutating old records. Version suffixes make
multiple previews preservable.

## Lifecycle

Allowed transitions:

- `PENDING -> BUILDING`
- `BUILDING -> READY`
- `BUILDING -> FAILED`
- `READY -> ARCHIVED`
- `FAILED -> PENDING`
- `PENDING/BUILDING -> ARCHIVED`

`READY` sets `deployed_at` and `is_current`. Older previews are marked
`is_current = false` and receive `superseded_at`; they are not automatically
deleted. `ARCHIVED` is a terminal, non-destructive state.

## Preview security

The schema supports `PUBLIC_DEMO`, `UNLISTED`, and `PASSWORD_PROTECTED`.
`UNLISTED` is the default. No elaborate auth is built. Preview UI shows a
disclaimer that a preview is not the business's live website.

## Future production-deployment boundary

Production deployment is modeled but not enabled. A future workstream must
add explicit approval, protected configuration, and separate provider/domain
settings before `PRODUCTION` can be used.

## DNS / wildcard configuration eventually required

For Vercel to serve `<slug>.preview.mintchipweb.com`, the `mintchipweb.com`
domain must have a wildcard DNS record pointing at Vercel, and the Vercel
project must accept preview deployments on that wildcard domain. This
workstream does not change DNS or Vercel project configuration.

## Vercel inspection result

- Vercel CLI is not installed in this environment.
- No `VERCEL_TOKEN` or Vercel project ID is configured for MintChipOS.
- No repo-local `.vercel/project.json` exists for MintChipOS.
- No live Vercel deployment was created.

