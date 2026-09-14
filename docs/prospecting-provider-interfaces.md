# Provider interfaces

## Discovery

`ProspectDiscoveryProvider` is the boundary for candidate discovery.

```ts
type ProspectDiscoveryProvider = {
  name: string;
  isLive: boolean;
  discover(input: DiscoveryInput): Promise<ProspectCandidate[]>;
};
```

Potential future implementations include search engines, public business
directories, map/business listing APIs, approved data providers, and
user-supplied lists. MintChipOS is not coupled to any one provider.

The current default is `FixtureDiscoveryProvider`, which is clearly marked
`isLive: false` and emits `source: "FIXTURE"` candidates. No live provider is
authorized yet.

## Website inspection

Website inspection is a bounded, deterministic service with a configurable
`fetchImpl`, so tests can exercise it without network access. It is not a
provider in the paid-data sense; it only fetches public HTML.

## Contact discovery

`ContactDiscoveryProvider` is the future boundary for compliant contact
enrichment. The current implementation, `PublicWebsiteContactProvider`, only
reads contact data already present on a candidate or in inspected public HTML.
It does not verify addresses, send email, or purchase enrichment services.

## Compliance boundaries

- Do not scrape services in ways that violate access restrictions.
- Respect provider terms, robots rules where applicable, and rate limits.
- Do not attempt CAPTCHA bypassing or access-control circumvention.
- Do not purchase or subscribe to paid providers during this workstream.

