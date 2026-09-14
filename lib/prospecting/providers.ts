import type {
  DiscoveryInput,
  ProspectCandidate,
  ProspectDiscoveryProvider,
} from "./types";

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function locationName(location: string): string {
  return clean(location.split(",")[0] ?? location) || "Local";
}

function fixtureCandidate(
  input: DiscoveryInput,
  index: number,
  industry: string,
): ProspectCandidate {
  const city = locationName(input.location);
  const label = clean(industry) || "local business";
  const businessName = `${city} ${label} ${index + 1} (Fixture)`;

  return {
    businessName,
    websiteUrl: null,
    industry: label,
    industrySubtype: null,
    city,
    state: clean(input.location.split(",")[1] ?? "") || null,
    country: "US",
    address: null,
    phone: null,
    publicEmail: null,
    contactPageUrl: null,
    socialUrls: [],
    source: "FIXTURE",
    sourceUrl: "fixture://local-prospecting",
    sourceMetadata: {
      fixture: true,
      note: "Deterministic fixture used because no live discovery provider is authorized.",
    },
    discoveredAt: new Date().toISOString(),
    appearsActive: true,
    localBusiness: true,
    locationCount: 1,
    reviewPresence: index % 2 === 0,
    reviewCount: index % 2 === 0 ? 4 + index : null,
    rating: index % 2 === 0 ? 4.5 : null,
    serviceSummary: `Fixture ${label} business in ${city}.`,
    businessDescription: "Fixture candidate for prospecting path verification.",
    confidence: 0.5,
    websitePresent: false,
  };
}

export class FixtureDiscoveryProvider implements ProspectDiscoveryProvider {
  readonly name = "fixture";
  readonly isLive = false;

  async discover(input: DiscoveryInput): Promise<ProspectCandidate[]> {
    const industries =
      input.industries.length > 0 ? input.industries : ["local business"];
    const candidates: ProspectCandidate[] = [];
    const limit = Math.max(1, Math.min(input.limit, 25));

    for (let index = 0; index < limit; index += 1) {
      const industry = industries[index % industries.length] ?? "local business";
      candidates.push(fixtureCandidate(input, index, industry));
    }

    return candidates;
  }
}

export function getDiscoveryProvider(): ProspectDiscoveryProvider {
  return new FixtureDiscoveryProvider();
}

