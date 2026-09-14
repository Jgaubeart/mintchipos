import type {
  DiscoverySource,
  ProspectStatus,
  ScanStatus,
  VisualAuditStatus,
} from "./constants";

export type JsonObject = Record<string, unknown>;

export type DuplicateKeys = {
  domain?: string;
  name?: string;
  phone?: string;
  address?: string;
};

export type ProspectCandidate = {
  businessName: string;
  websiteUrl?: string | null;
  industry?: string | null;
  industrySubtype?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  phone?: string | null;
  publicEmail?: string | null;
  contactPageUrl?: string | null;
  socialUrls?: string[];
  source: DiscoverySource;
  sourceUrl?: string | null;
  sourceMetadata?: JsonObject;
  discoveredAt?: string | null;
  appearsActive?: boolean | null;
  localBusiness?: boolean | null;
  locationCount?: number | null;
  reviewPresence?: boolean | null;
  reviewCount?: number | null;
  rating?: number | null;
  serviceSummary?: string | null;
  businessDescription?: string | null;
  confidence?: number | null;
  websitePresent?: boolean | null;
};

export type NormalizedCandidate = {
  businessName: string;
  websiteUrl: string | null;
  industry: string | null;
  industrySubtype: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  publicEmail: string | null;
  contactPageUrl: string | null;
  socialUrls: string[];
  source: DiscoverySource;
  sourceUrl: string | null;
  sourceMetadata: JsonObject;
  discoveredAt: string | null;
  appearsActive: boolean | null;
  localBusiness: boolean | null;
  locationCount: number | null;
  reviewPresence: boolean | null;
  reviewCount: number | null;
  rating: number | null;
  serviceSummary: string | null;
  businessDescription: string | null;
  confidence: number | null;
  websitePresent: boolean | null;
  domain: string | null;
  duplicateFingerprint: string;
  duplicateKeys: DuplicateKeys;
};

export type WebsiteInspectionResult = {
  websitePresent: boolean;
  websiteReachable: boolean;
  httpStatus: number | null;
  httpsPresent: boolean;
  title: string | null;
  metaDescriptionPresent: boolean;
  viewportPresent: boolean;
  mobileResponsive: boolean | null;
  navigationLinkCount: number;
  phoneLinks: string[];
  emailLinks: string[];
  contactLinks: string[];
  contactPageUrl: string | null;
  formPresent: boolean;
  portfolioPresent: boolean;
  testimonialsPresent: boolean;
  imageCount: number;
  socialLinks: string[];
  pageCountEstimate: number;
  brokenLinks: string[];
  lastModifiedAt: string | null;
  visualAuditStatus: VisualAuditStatus;
  auditNotes: string[];
  auditTimestamp: string | null;
};

export type ProspectRecord = {
  id: string;
  businessName: string;
  websiteUrl: string | null;
  domain: string | null;
  industry: string | null;
  industrySubtype: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  publicEmail: string | null;
  contactPageUrl: string | null;
  socialUrls: string[];
  discoverySource: DiscoverySource;
  discoveredAt: string | null;
  scanId: string | null;
  sourceUrl: string | null;
  sourceMetadata: JsonObject;
  duplicateFingerprint: string;
  appearsActive: boolean | null;
  localBusiness: boolean | null;
  locationCount: number | null;
  reviewPresence: boolean | null;
  reviewCount: number | null;
  rating: number | null;
  serviceSummary: string | null;
  businessDescription: string | null;
  confidence: number | null;
  websitePresent: boolean;
  websiteReachable: boolean;
  httpsPresent: boolean;
  mobileResponsive: boolean | null;
  pageCountEstimate: number;
  brokenLinks: string[];
  contactCtaPresent: boolean;
  phoneCtaPresent: boolean;
  contactFormPresent: boolean;
  portfolioPresent: boolean;
  testimonialsPresent: boolean;
  lastModifiedAt: string | null;
  visualAuditStatus: VisualAuditStatus;
  auditNotes: string[];
  auditTimestamp: string | null;
  emailFound: boolean;
  email: string | null;
  emailSourceUrl: string | null;
  phoneFound: boolean;
  contactPageFound: boolean;
  contactabilityConfidence: number | null;
  prospectStatus: ProspectStatus;
  qualificationScore: number;
  websiteOpportunityScore: number;
  businessQualityScore: number;
  contactabilityScore: number;
  disqualificationReasons: string[];
  qualificationReasons: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type QualificationScores = {
  businessQualityScore: number;
  websiteOpportunityScore: number;
  contactabilityScore: number;
  qualificationScore: number;
};

export type QualificationResult = QualificationScores & {
  prospectStatus: ProspectStatus;
  contactabilityConfidence: number | null;
  disqualificationReasons: string[];
  qualificationReasons: string[];
};

export type DiscoveryInput = {
  location: string;
  industries: string[];
  limit: number;
  radiusKm?: number | null;
  exclusions?: string[];
  sourceConfig?: JsonObject;
};

export type ProspectDiscoveryProvider = {
  name: string;
  isLive: boolean;
  discover(input: DiscoveryInput): Promise<ProspectCandidate[]>;
};

export type ContactDiscoveryResult = {
  email: string | null;
  emailFound: boolean;
  emailSourceUrl: string | null;
  phone: string | null;
  phoneFound: boolean;
  contactPageUrl: string | null;
  contactPageFound: boolean;
  notes: string[];
};

export type ContactDiscoveryProvider = {
  name: string;
  discover(
    candidate: NormalizedCandidate,
    website: WebsiteInspectionResult,
  ): ContactDiscoveryResult;
};

export type ScanCounters = {
  discoveredCount: number;
  auditedCount: number;
  qualifiedCount: number;
  disqualifiedCount: number;
  errorCount: number;
};

export type ProspectScanConfig = {
  location: string;
  radiusKm: number | null;
  industries: string[];
  categories: string[];
  maxProspects: number;
  exclusions: string[];
  sourceConfig: JsonObject;
};

export type ProspectScanRecord = {
  id: string;
  location: string;
  radiusKm: number | null;
  industries: string[];
  categories: string[];
  maxProspects: number;
  exclusions: string[];
  status: ScanStatus;
  sourceConfig: JsonObject;
  discoveredCount: number;
  auditedCount: number;
  qualifiedCount: number;
  disqualifiedCount: number;
  errorCount: number;
  errors: string[];
  createdBy: string | null;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type ProspectScanExecutionResult = {
  prospects: ProspectRecord[];
  counters: ScanCounters;
};

export type WebsiteInspectionOptions = {
  maxPages?: number;
  maxRequests?: number;
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: FetchLike;
};

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;
