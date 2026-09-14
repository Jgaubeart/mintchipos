export const WEBSITE_FACTORY_STAGES = [
  "BUSINESS_RESEARCH",
  "INDUSTRY_CLASSIFICATION",
  "PLAYBOOK_SELECTION",
  "DESIGN_BRIEF",
  "UX_CONTENT_STRATEGY",
  "ASSET_AUDIT",
  "CREATIVE_DIRECTION",
  "ASSET_PLAN",
  "FRONTEND_BUILD",
  "FUNCTIONAL_QA",
  "VISUAL_QA",
  "PREVIEW_DEPLOYMENT",
] as const;

export type WebsiteFactoryStage =
  (typeof WEBSITE_FACTORY_STAGES)[number];

export const WEBSITE_FACTORY_RUN_STATUSES = [
  "NOT_STARTED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "READY_FOR_LIVE_VERIFICATION",
] as const;

export type WebsiteFactoryRunStatus =
  (typeof WEBSITE_FACTORY_RUN_STATUSES)[number];

export const STAGE_STATUSES = [
  "NOT_STARTED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "BLOCKED",
] as const;

export type WebsiteFactoryStageStatus = (typeof STAGE_STATUSES)[number];

export const MAX_REPAIR_CYCLES = 3;

export const DEFAULT_FACTORY_SITE_FORMAT = "ONE_PAGE";

export const MINT_CHIP_BUSINESS_RULES = {
  defaultSiteFormat: "ONE_PAGE",
  defaultCreativeAuthorityLevel: 3,
  defaultPreviewVisibility: "UNLISTED",
  authenticityRules: [
    "Do not invent employees.",
    "Do not invent completed client projects as factual work.",
    "Do not invent testimonials or reviews.",
    "Do not invent awards or certifications.",
    "Do not invent factual business claims.",
    "Representative demo imagery must be identified as demo content.",
  ],
  decisionPrecedence: [
    "SYSTEM_OR_MINT_CHIP_BUSINESS_RULES",
    "PROJECT_DESIGN_DIRECTION_BRIEF",
    "INDUSTRY_PLAYBOOK",
    "AGENT_CREATIVE_JUDGMENT",
  ],
} as const;

export const WEBSITE_FACTORY_STAGE_LABELS: Record<
  WebsiteFactoryStage,
  string
> = {
  BUSINESS_RESEARCH: "Research",
  INDUSTRY_CLASSIFICATION: "Industry",
  PLAYBOOK_SELECTION: "Playbook",
  DESIGN_BRIEF: "Design Brief",
  UX_CONTENT_STRATEGY: "Content",
  ASSET_AUDIT: "Asset Audit",
  CREATIVE_DIRECTION: "Creative",
  ASSET_PLAN: "Asset Plan",
  FRONTEND_BUILD: "Build",
  FUNCTIONAL_QA: "Functional QA",
  VISUAL_QA: "Visual QA",
  PREVIEW_DEPLOYMENT: "Preview",
};

