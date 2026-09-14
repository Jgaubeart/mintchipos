export const PROSPECT_STATUSES = [
  "DISCOVERED",
  "AUDIT_PENDING",
  "QUALIFIED",
  "DISQUALIFIED",
  "READY_FOR_DEMO",
  "DEMO_GENERATED",
  "OUTREACH_READY",
  "OUTREACH_SENT",
  "CONVERTED",
  "ARCHIVED",
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const SCAN_STATUSES = [
  "DRAFT",
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type ScanStatus = (typeof SCAN_STATUSES)[number];

export const DISCOVERY_SOURCES = [
  "FIXTURE",
  "USER_LIST",
  "SEARCH_ENGINE",
  "BUSINESS_DIRECTORY",
  "MAP_LISTING",
  "DATA_PROVIDER",
  "MANUAL",
] as const;

export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number];

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  DISCOVERED: "Discovered",
  AUDIT_PENDING: "Audit pending",
  QUALIFIED: "Qualified",
  DISQUALIFIED: "Disqualified",
  READY_FOR_DEMO: "Ready for demo",
  DEMO_GENERATED: "Demo generated",
  OUTREACH_READY: "Outreach ready",
  OUTREACH_SENT: "Outreach sent",
  CONVERTED: "Converted",
  ARCHIVED: "Archived",
};

export const SCAN_STATUS_LABELS: Record<ScanStatus, string> = {
  DRAFT: "Draft",
  QUEUED: "Queued",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const DISCOVERY_SOURCE_LABELS: Record<DiscoverySource, string> = {
  FIXTURE: "Fixture",
  USER_LIST: "User list",
  SEARCH_ENGINE: "Search engine",
  BUSINESS_DIRECTORY: "Business directory",
  MAP_LISTING: "Map listing",
  DATA_PROVIDER: "Data provider",
  MANUAL: "Manual",
};

export const DEFAULT_QUALIFICATION_WEIGHTS = {
  businessFit: 0.4,
  websiteOpportunity: 0.4,
  contactability: 0.2,
} as const;

export const QUALIFIED_SCORE_THRESHOLD = 60;

export const DEFAULT_SCAN_LIMITS = {
  maxProspects: 100,
  maxProspectsHardCap: 250,
  maxIndustries: 12,
} as const;

export const DEFAULT_CRAWL_LIMITS = {
  maxPages: 5,
  maxRequests: 12,
  timeoutMs: 8000,
  maxBytes: 250_000,
} as const;

// Industries where a portfolio/gallery is a common conversion signal. This
// list is intentionally coarse and is used only for the deterministic V1
// qualification rubric.
export const INDUSTRIES_THAT_TYPICALLY_NEED_PORTFOLIO = [
  "roofing",
  "landscaping",
  "construction",
  "remodeling",
  "home improvement",
  "plumbing",
  "electrical",
  "hvac",
  "painting",
  "concrete",
  "masonry",
  "photography",
  "interior design",
  "web design",
  "architecture",
] as const;

export const VISUAL_AUDIT_STATUSES = [
  "NOT_INSPECTED",
  "BASIC",
  "FAILED",
] as const;

export type VisualAuditStatus = (typeof VISUAL_AUDIT_STATUSES)[number];

