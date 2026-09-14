# Qualification rubric V1

The rubric is deterministic and intentionally does not use AI scoring.

## Scores

- `businessQualityScore` — 0–100, weighted 40%
- `websiteOpportunityScore` — 0–100, weighted 40%
- `contactabilityScore` — 0–100, weighted 20%
- `qualificationScore` — weighted 0–100, rounded and clamped

Weights live in `lib/prospecting/constants.ts`, not scattered through the
scoring code.

## Business fit

Positive signals include:

- local business
- appears active
- matches target industry
- small / local footprint
- review presence
- publicly available address
- confidence at or above 0.6

## Website opportunity

Opportunity is higher when a business has:

- no website
- an unreachable website
- missing HTTPS
- no mobile viewport
- no contact CTA
- no phone CTA
- limited conversion UX
- a very thin site
- broken links
- a missing portfolio in an industry that commonly benefits from one
- weak public contact visibility

## Contactability

Contactability is derived only from already-public data:

- public business email found
- contact page found
- public phone found
- contact route visible on website

Email addresses are never guessed or synthesized.

## Qualification status

- `DISQUALIFIED` — explicit business-fit rule failure
- `QUALIFIED` — score at or above 60 and no disqualification reason
- `AUDIT_PENDING` — score below 60 and no disqualification reason

Disqualification rules:

- `localBusiness === false`
- `appearsActive === false`
- `locationCount > 20` (treated as an obvious national chain)

Every result stores `qualificationReasons` and `disqualificationReasons` so
operators can explain a score, not just see a number.

