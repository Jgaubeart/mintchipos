# Railway and Vercel deployment / troubleshooting

## Deploy targets

- Vercel: Next.js app, production domain `https://os.mintchipweb.com`.
- Railway: Hermes execution runtime (async `/v1/runs`).
- Supabase: durable database (see `docs/supabase-migrations.md`).

## Local CLIs and authentication

Verified on Windows:

- `gh` 2.100.0 is installed; re-authenticate with `gh auth login -h github.com -p https -w`
  (device-code flow).
- Install Railway and Vercel CLIs with `npm install -g @railway/cli vercel`.
- `railway login --browserless` prints a one-time device code.
- `vercel login` opens a browser/device flow.

Read-only verification commands:

```bash
gh auth status
gh repo view Jgaubeart/mintchipos

railway whoami
railway status
railway service list
railway logs --limit 20

vercel whoami
vercel projects ls
vercel ls mintchipos
vercel inspect os.mintchipweb.com
vercel logs --project mintchipos --limit 20
```

Never store tokens in this file. One-time interactive login remains a human
step; a coding agent can initiate it but cannot approve it.

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
