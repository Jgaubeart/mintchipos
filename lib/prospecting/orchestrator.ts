import { PublicWebsiteContactProvider } from "./contact";
import { dedupeCandidates } from "./dedupe";
import { normalizeCandidate } from "./normalize";
import { getDiscoveryProvider } from "./providers";
import { scoreProspect } from "./scoring";
import type {
  DiscoveryInput,
  NormalizedCandidate,
  ProspectDiscoveryProvider,
  ProspectRecord,
  ProspectScanExecutionResult,
  WebsiteInspectionOptions,
  WebsiteInspectionResult,
} from "./types";
import { inspectWebsite, notInspected } from "./website";

export type ProspectScanExecutionOptions = {
  discoveryProvider?: ProspectDiscoveryProvider;
  inspectWebsites?: boolean;
  websiteInspectionOptions?: WebsiteInspectionOptions;
};

function makeId(index: number, fingerprint: string): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) {
    return random;
  }

  return `prospect-${fingerprint.slice(0, 24)}-${index}`;
}

function deferredWebsiteInspection(
  candidate: NormalizedCandidate,
): WebsiteInspectionResult {
  return {
    ...notInspected("Website inspection is deferred for this provider."),
    websitePresent: true,
    websiteReachable: false,
    httpsPresent: Boolean(
      candidate.websiteUrl?.toLowerCase().startsWith("https://"),
    ),
  };
}

function buildProspectRecord(input: {
  index: number;
  candidate: NormalizedCandidate;
  website: WebsiteInspectionResult;
  scanId?: string | null;
  targetIndustries: string[];
}): ProspectRecord {
  const contact = new PublicWebsiteContactProvider().discover(
    input.candidate,
    input.website,
  );
  const qualification = scoreProspect({
    candidate: input.candidate,
    website: input.website,
    contact,
    targetIndustries: input.targetIndustries,
  });

  return {
    id: makeId(input.index, input.candidate.duplicateFingerprint),
    businessName: input.candidate.businessName,
    websiteUrl: input.candidate.websiteUrl,
    domain: input.candidate.domain,
    industry: input.candidate.industry,
    industrySubtype: input.candidate.industrySubtype,
    city: input.candidate.city,
    state: input.candidate.state,
    country: input.candidate.country,
    address: input.candidate.address,
    phone: input.candidate.phone,
    publicEmail: input.candidate.publicEmail,
    contactPageUrl: contact.contactPageUrl,
    socialUrls: input.candidate.socialUrls,
    discoverySource: input.candidate.source,
    discoveredAt: input.candidate.discoveredAt ?? new Date().toISOString(),
    scanId: input.scanId ?? null,
    sourceUrl: input.candidate.sourceUrl,
    sourceMetadata: input.candidate.sourceMetadata ?? {},
    duplicateFingerprint: input.candidate.duplicateFingerprint,
    appearsActive: input.candidate.appearsActive ?? null,
    localBusiness: input.candidate.localBusiness ?? null,
    locationCount: input.candidate.locationCount ?? null,
    reviewPresence: input.candidate.reviewPresence ?? null,
    reviewCount: input.candidate.reviewCount ?? null,
    rating: input.candidate.rating ?? null,
    serviceSummary: input.candidate.serviceSummary ?? null,
    businessDescription: input.candidate.businessDescription ?? null,
    confidence: input.candidate.confidence ?? null,
    websitePresent: input.website.websitePresent,
    websiteReachable: input.website.websiteReachable,
    httpsPresent: input.website.httpsPresent,
    mobileResponsive: input.website.mobileResponsive,
    pageCountEstimate: input.website.pageCountEstimate,
    brokenLinks: input.website.brokenLinks,
    contactCtaPresent: input.website.contactLinks.length > 0,
    phoneCtaPresent: input.website.phoneLinks.length > 0,
    contactFormPresent: input.website.formPresent,
    portfolioPresent: input.website.portfolioPresent,
    testimonialsPresent: input.website.testimonialsPresent,
    lastModifiedAt: input.website.lastModifiedAt,
    visualAuditStatus: input.website.visualAuditStatus,
    auditNotes: input.website.auditNotes,
    auditTimestamp: input.website.auditTimestamp,
    emailFound: contact.emailFound,
    email: contact.email,
    emailSourceUrl: contact.emailSourceUrl,
    phoneFound: contact.phoneFound,
    contactPageFound: contact.contactPageFound,
    contactabilityConfidence: qualification.contactabilityConfidence,
    prospectStatus: qualification.prospectStatus,
    qualificationScore: qualification.qualificationScore,
    websiteOpportunityScore: qualification.websiteOpportunityScore,
    businessQualityScore: qualification.businessQualityScore,
    contactabilityScore: qualification.contactabilityScore,
    disqualificationReasons: qualification.disqualificationReasons,
    qualificationReasons: qualification.qualificationReasons,
  };
}

export async function executeProspectScan(
  input: DiscoveryInput,
  options: ProspectScanExecutionOptions = {},
): Promise<ProspectScanExecutionResult> {
  const provider = options.discoveryProvider ?? getDiscoveryProvider();
  const candidates = await provider.discover(input);
  const normalized = candidates
    .map((candidate) => normalizeCandidate(candidate))
    .filter((candidate): candidate is NormalizedCandidate => candidate !== null);
  const unique = dedupeCandidates(normalized);
  const shouldInspect = options.inspectWebsites ?? provider.isLive;

  const resolved: ProspectRecord[] = [];

  for (const candidate of unique) {
    const websitePresent =
      candidate.websitePresent ?? Boolean(candidate.websiteUrl);
    let website: WebsiteInspectionResult;

    if (!websitePresent) {
      website = notInspected("No website URL was discovered.");
    } else if (shouldInspect && candidate.websiteUrl) {
      website = await inspectWebsite(
        candidate.websiteUrl,
        options.websiteInspectionOptions,
      );
    } else {
      website = deferredWebsiteInspection(candidate);
    }

    resolved.push(
      buildProspectRecord({
        index: resolved.length,
        candidate,
        website,
        targetIndustries: input.industries,
      }),
    );
  }

  const counters = {
    discoveredCount: resolved.length,
    auditedCount: resolved.filter(
      (prospect) => prospect.visualAuditStatus === "BASIC",
    ).length,
    qualifiedCount: resolved.filter(
      (prospect) => prospect.prospectStatus === "QUALIFIED",
    ).length,
    disqualifiedCount: resolved.filter(
      (prospect) => prospect.prospectStatus === "DISQUALIFIED",
    ).length,
    errorCount: resolved.filter(
      (prospect) => prospect.visualAuditStatus === "FAILED",
    ).length,
  };

  return { prospects: resolved, counters };
}
