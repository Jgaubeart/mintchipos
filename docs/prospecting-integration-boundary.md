# Future integration boundary

This workstream stops at qualified prospects. A future milestone can consume a
`QUALIFIED` prospect and hand off:

- `businessName`
- `websiteUrl`
- `industry`
- research context
- discovered assets and data

into:

1. Industry Playbook
2. Business Research
3. Generated Design Direction Brief
4. Website Generation

No handoff execution is implemented here. The prospect record is designed to
remain forward-compatible with later states such as `READY_FOR_DEMO`,
`DEMO_GENERATED`, `OUTREACH_READY`, and `OUTREACH_SENT`.

