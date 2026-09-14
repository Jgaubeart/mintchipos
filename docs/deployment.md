# Railway and Vercel deployment / troubleshooting

## Deploy targets

- Vercel: Next.js app, production domain `https://os.mintchipweb.com`.
- Railway: Hermes execution runtime (async `/v1/runs`).
- Supabase: durable database (see `docs/supabase-migrations.md`).

## Current local access status

- Git over HTTPS to `github.com/Jgaubeart/mintchipos` works.
- `gh` CLI has an invalid token; re-authenticate with `gh auth login -h github.com`.
- Railway CLI is not installed and no `RAILWAY_TOKEN` is present.
- Vercel CLI is not installed and no `VERCEL_TOKEN` is present.

To read Railway/Vercel logs directly, install the CLIs and authenticate:

```bash
npm i -g @railway/cli && railway login
npm i -g vercel && vercel login
```

Prefer the hosted MCP/CLI integrations documented by Railway and Vercel over
guessing UI settings. One-time interactive login remains a human step.

## Hermes runtime configuration

- Model: `deepseek-v4-pro`
- Auth: `Authorization: Bearer <HERMES_API_KEY>`
- Normalize `HERMES_API_URL` (strip trailing slashes)
- `HERMES_API_KEY` is server-only; never prefix it with `NEXT_PUBLIC_`

## Troubleshooting pointers

- JSON returned as text / wrong field names: see `docs/known-issues.md`.
- Long runs timing out: 180s generic default, 300s Research Strategist.
- Preview: `npm run dev` on `http://localhost:3000` is the non-production
  preview path. Production deploy requires explicit approval.
