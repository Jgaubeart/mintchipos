import type {
  DuplicateKeys,
  NormalizedCandidate,
  ProspectCandidate,
} from "./types";

function cleanText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeBusinessName(
  value: string | null | undefined,
): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayBusinessName(
  value: string | null | undefined,
): string {
  return cleanText(value);
}

export function normalizeDomain(
  value: string | null | undefined,
): string | null {
  const raw = cleanText(value);
  if (!raw) {
    return null;
  }

  let candidate = raw;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return hostname || null;
  } catch {
    return null;
  }
}

export function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits.slice(-10);
}

function normalizeAddress(value: string | null | undefined): string {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

export function buildDuplicateKeys(
  candidate: Pick<
    ProspectCandidate,
    "businessName" | "websiteUrl" | "phone" | "address"
  >,
): DuplicateKeys {
  const keys: DuplicateKeys = {};

  const domain = normalizeDomain(candidate.websiteUrl);
  const name = normalizeBusinessName(candidate.businessName);
  const phone = normalizePhone(candidate.phone);
  const address = normalizeAddress(candidate.address);

  if (domain) {
    keys.domain = domain;
  }
  if (name) {
    keys.name = name;
  }
  if (phone) {
    keys.phone = phone;
  }
  if (address) {
    keys.address = address;
  }

  return keys;
}

export function buildDuplicateFingerprint(keys: DuplicateKeys): string {
  const parts = [
    keys.domain ? `domain:${keys.domain}` : "domain:none",
    keys.name ? `name:${keys.name}` : "name:none",
    keys.phone ? `phone:${keys.phone}` : "phone:none",
    keys.address ? `address:${keys.address}` : "address:none",
  ];

  return parts.join("|");
}

export function normalizeCandidate(
  candidate: ProspectCandidate,
): NormalizedCandidate | null {
  const businessName = displayBusinessName(candidate.businessName);
  if (!businessName) {
    return null;
  }

  const domain = normalizeDomain(candidate.websiteUrl);
  const duplicateKeys = buildDuplicateKeys(candidate);

  return {
    ...candidate,
    businessName,
    websiteUrl: candidate.websiteUrl?.trim() || null,
    industry: cleanText(candidate.industry) || null,
    industrySubtype: cleanText(candidate.industrySubtype) || null,
    city: cleanText(candidate.city) || null,
    state: cleanText(candidate.state) || null,
    country: cleanText(candidate.country) || null,
    address: cleanText(candidate.address) || null,
    phone: normalizePhone(candidate.phone) || null,
    publicEmail: candidate.publicEmail?.trim().toLowerCase() || null,
    contactPageUrl: candidate.contactPageUrl?.trim() || null,
    socialUrls: Array.isArray(candidate.socialUrls)
      ? candidate.socialUrls.map((url) => url.trim()).filter(Boolean)
      : [],
    source: candidate.source,
    sourceUrl: candidate.sourceUrl?.trim() || null,
    sourceMetadata: candidate.sourceMetadata ?? {},
    discoveredAt: candidate.discoveredAt ?? null,
    appearsActive: candidate.appearsActive ?? null,
    localBusiness: candidate.localBusiness ?? null,
    locationCount: candidate.locationCount ?? null,
    reviewPresence: candidate.reviewPresence ?? null,
    reviewCount: candidate.reviewCount ?? null,
    rating: candidate.rating ?? null,
    serviceSummary: cleanText(candidate.serviceSummary) || null,
    businessDescription: cleanText(candidate.businessDescription) || null,
    confidence: candidate.confidence ?? null,
    websitePresent: candidate.websitePresent ?? null,
    domain,
    duplicateFingerprint: buildDuplicateFingerprint(duplicateKeys),
    duplicateKeys,
  };
}
