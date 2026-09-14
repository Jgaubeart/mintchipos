# Testing

## Repeatable verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run them together with:

```bash
npm run verify
```

## What each command does

- `npm run lint` — ESLint (Next.js config)
- `npm run typecheck` — `tsc --noEmit --incremental false`
- `npm test` — compiles `tsconfig.test.json` to `out/test`, then runs
  `node --test "out/test/tests/*.test.js"`
- `npm run build` — Next.js production build (Turbopack)

`npm test` and `npm run build` write to `out/` and `.next/`, so in a sandboxed
environment they need write escalation.

## Test conventions

- `tests/hermes-runtime.test.ts` — Hermes async run adapter (mocked `fetch`)
- `tests/research-workflow.test.ts` — research schema, normalization, prompt
- `tests/acceptance-execution.test.ts` — local end-to-end execution acceptance

Hermes network is always mocked in tests. Never call the live Hermes endpoint
or a paid model from automated tests.

## Local acceptance check

`tests/acceptance-execution.test.ts` exercises the current execution flow with
fixtures/mocks: async admission -> poll -> completed JSON-text output ->
normalize -> schema validation. It does not touch live Supabase or Hermes.
