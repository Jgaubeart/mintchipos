export const PLAYBOOK_BRIEF_ARTIFACT_TYPE = "PLAYBOOK_BRIEF";
export const INDUSTRY_PLAYBOOK_ARTIFACT_TYPE = "INDUSTRY_PLAYBOOK";

export const PLAYBOOK_BRIEF_SCHEMA_VERSION = 1;
export const INDUSTRY_PLAYBOOK_SCHEMA_VERSION = 1;

export const RESEARCH_QUESTION_TOPICS = [
  "BUYING_PSYCHOLOGY",
  "CUSTOMER_PRIORITIES",
  "CUSTOMER_PAIN_POINTS",
  "COMMON_OBJECTIONS",
  "TRUST_SIGNALS",
  "COMMON_CONVERSION_GOALS",
  "COMMON_CTA_PATTERNS",
  "COMMON_PAGE_STRUCTURES",
  "EFFECTIVE_ONE_PAGE_STRUCTURES",
  "EFFECTIVE_FIVE_PAGE_STRUCTURES",
  "CONTENT_HIERARCHY",
  "VISUAL_DESIGN_PATTERNS",
  "TYPOGRAPHY_PATTERNS",
  "COLOR_PATTERNS",
  "PHOTOGRAPHY_MEDIA_PATTERNS",
  "MOTION_INTERACTION_PATTERNS",
  "MOBILE_UX_PRIORITIES",
  "LOCAL_SEO_CONSIDERATIONS",
  "ACCESSIBILITY_CONSIDERATIONS",
  "INDUSTRY_COMPLIANCE_CONCERNS",
  "COMMON_WEBSITE_MISTAKES",
  "OVERUSED_DESIGN_CLICHES",
  "CREATIVE_OPPORTUNITIES",
] as const;

export type ResearchQuestionTopic = (typeof RESEARCH_QUESTION_TOPICS)[number];

export type IndustryPlaybookField =
  | { key: string; kind: "string" }
  | { key: string; kind: "stringArray" }
  | { key: string; kind: "sources" };

export const INDUSTRY_PLAYBOOK_FIELDS: IndustryPlaybookField[] = [
  { key: "industryOverview", kind: "string" },
  { key: "typicalBusinessProfile", kind: "string" },
  { key: "targetCustomer", kind: "string" },
  { key: "buyingPsychology", kind: "string" },
  { key: "customerPriorities", kind: "stringArray" },
  { key: "painPoints", kind: "stringArray" },
  { key: "commonObjections", kind: "stringArray" },
  { key: "trustSignals", kind: "stringArray" },
  { key: "primaryConversionGoals", kind: "stringArray" },
  { key: "ctaPatterns", kind: "stringArray" },
  { key: "onePageStructure", kind: "stringArray" },
  { key: "fivePageStructure", kind: "stringArray" },
  { key: "contentStrategy", kind: "string" },
  { key: "messagingGuidance", kind: "string" },
  { key: "visualDesignGuidance", kind: "string" },
  { key: "typographyGuidance", kind: "string" },
  { key: "colorGuidance", kind: "string" },
  { key: "photographyAssetGuidance", kind: "string" },
  { key: "aiAssetOpportunities", kind: "stringArray" },
  { key: "motionInteractionGuidance", kind: "string" },
  { key: "mobilePriorities", kind: "stringArray" },
  { key: "seoLocalSearchGuidance", kind: "string" },
  { key: "accessibilityComplianceNotes", kind: "stringArray" },
  { key: "commonWebsiteMistakes", kind: "stringArray" },
  { key: "designClichesToAvoid", kind: "stringArray" },
  { key: "creativeOpportunities", kind: "stringArray" },
  { key: "evidenceSources", kind: "sources" },
  { key: "confidenceAssumptions", kind: "stringArray" },
];

export function humanizeToken(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
