import type { DemoDeploymentProvider } from "@/lib/demo-staging/types";
import type { DesignBrief } from "@/lib/design-brief/types";
import type { IndustryPlaybook } from "@/lib/playbooks/types";
import type {
  WebsiteFactoryRunStatus,
  WebsiteFactoryStage,
  WebsiteFactoryStageStatus,
} from "./constants";

export type JsonObject = Record<string, unknown>;

export type WebsiteFactoryInput = {
  projectId: string;
  websiteUrl: string;
  businessName?: string | null;
  existingBrief?: DesignBrief | null;
};

export type ResearchSourceEvidence = {
  url: string;
  note: string;
};

export type BusinessResearch = {
  businessName: string;
  domain: string | null;
  websiteUrl: string;
  location: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  services: string[];
  products: string[];
  serviceAreas: string[];
  phone: string | null;
  publicEmail: string | null;
  contactUrl: string | null;
  socialUrls: string[];
  testimonialsPresent: string[];
  reviewsPresent: string[];
  licensesCertifications: string[];
  yearsInBusiness: string | null;
  guarantees: string[];
  trustBadges: string[];
  portfolioPresent: string[];
  currentPages: string[];
  ctaPatterns: string[];
  navigation: string[];
  formsPresent: boolean;
  images: string[];
  metadata: JsonObject;
  technicalQuality: string[];
  headline: string | null;
  valueProposition: string | null;
  notableCopy: string[];
  provenance: ResearchSourceEvidence[];
  confidence: number;
};

export type IndustryClassification = {
  primaryIndustry: string;
  subtype: string;
  confidence: number;
  alternateIndustry: string | null;
  exception: string | null;
  matchedKeywords: string[];
};

export type PlaybookSelection = {
  industryName: string;
  artifactType: "INDUSTRY_PLAYBOOK";
  artifactVersionId: string | null;
  fallbackReason: string | null;
};

export type AutoDesignBriefResult = {
  brief: DesignBrief;
  precedence: string[];
  lineage: {
    businessResearch: boolean;
    industryPlaybook: boolean;
    systemRules: boolean;
  };
};

export type UxContentStrategy = {
  storytellingFlow: string;
  sectionSequence: string[];
  sectionPurpose: JsonObject;
  messagingHierarchy: string[];
  headlineStrategy: string;
  contentOutline: string[];
  ctaPlacement: string[];
  trustPlacement: string[];
  mobileFlow: string;
  draftCopyDirection: string;
  contentGaps: string[];
};

export type AssetAuditItem = {
  id: string;
  assetType: string;
  sourceUrl: string | null;
  provenance: string;
  dimensions: string | null;
  format: string | null;
  qualityAssessment: string;
  classification: "KEEP" | "IMPROVE" | "REPLACE" | "GENERATE" | "DO_NOT_USE";
  demoOnly: boolean;
  productionStatus: string;
  usageRightsStatus: string;
};

export type AssetAudit = {
  items: AssetAuditItem[];
  summary: string;
};

export type CreativeDirection = {
  centralVisualConcept: string;
  narrativeConcept: string;
  sectionComposition: string[];
  sectionOrder: string[];
  hierarchy: string[];
  typographySystem: string;
  colorApplication: string;
  imageryStrategy: string;
  graphicMotifs: string[];
  backgroundTreatment: string;
  shapeLanguage: string;
  motionDirection: string;
  mobileComposition: string;
  ctaPresentation: string;
  customAssetsNeeded: string[];
  antiPatterns: string[];
};

export type AssetPlan = {
  plannedAssets: string[];
  visualLanguageRule: string;
  generationBlocked: boolean;
  placeholderStrategy: string;
};

export type FrontendBuildResult = {
  siteFormat: "ONE_PAGE" | "FIVE_PAGE";
  html: string;
  sourceFiles: string[];
  buildId: string | null;
  buildResult: string;
};

export type FunctionalQaReport = {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  defects: string[];
};

export type VisualQaStatus =
  | "PASSED"
  | "PASSED_WITH_DEMO_LIMITATIONS"
  | "FAILED";

export type DemoLimitation =
  | "MISSING_REAL_PHONE"
  | "MISSING_REAL_EMAIL"
  | "FORM_NOT_CONNECTED"
  | "PLACEHOLDER_REVIEWS"
  | "PLACEHOLDER_PORTFOLIO"
  | "PLACEHOLDER_IMAGES"
  | "MISSING_CUSTOMER_ASSETS"
  | "MISSING_PRODUCTION_INTEGRATION"
  | "OTHER_DISCLOSED_DEMO_LIMITATION";

export type VisualQaReport = {
  status: VisualQaStatus;
  score: number;
  blockingDefects: string[];
  demoLimitations: DemoLimitation[];
  recommendations: string[];
  summary: string;
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  defects: string[];
};

export type PreviewDeploymentResult = {
  providerDeploymentId: string;
  previewUrl: string;
  previewHostname: string | null;
  status: "READY" | "PENDING" | "FAILED";
};

export type WebsiteFactoryArtifact = {
  stage: WebsiteFactoryStage;
  artifactType: string;
  artifactVersionId: string | null;
};

export type WebsiteFactoryStageResult = {
  stage: WebsiteFactoryStage;
  status: WebsiteFactoryStageStatus;
  startedAt: string | null;
  completedAt: string | null;
  output: unknown;
  artifact: WebsiteFactoryArtifact | null;
  defectCount: number;
  message: string | null;
};

export type WebsiteFactoryRun = {
  id: string;
  projectId: string;
  websiteUrl: string;
  businessName: string | null;
  status: WebsiteFactoryRunStatus;
  currentStage: WebsiteFactoryStage | null;
  progress: number;
  stages: WebsiteFactoryStageResult[];
  artifacts: WebsiteFactoryArtifact[];
  previewUrl: string | null;
  previewHostname: string | null;
  buildId: string | null;
  providerDeploymentId: string | null;
  failureReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WebsiteFactoryServices = {
  researchProvider?: WebsiteFactoryResearchProvider;
  playbookProvider?: PlaybookSelectionProvider;
  agentRuntime?: WebsiteFactoryAgentRuntime;
  frontendBuilder?: FrontendBuilder;
  deploymentProvider?: DemoDeploymentProvider;
  allowPreviewWhenFailed?: boolean;
  now?: () => string;
};

export type WebsiteFactoryAgentRuntime = {
  executeStage(
    input: {
      stage: WebsiteFactoryStage;
      agentKey: string;
      projectId: string;
      stageInput: unknown;
    },
  ): Promise<{
    output: unknown;
    agentRunId: string;
  }>;
};

export type WebsiteFactoryResearchProvider = {
  research(input: WebsiteFactoryInput): Promise<BusinessResearch>;
};

export type PlaybookSelectionProvider = {
  select(classification: IndustryClassification): Promise<{
    playbook: IndustryPlaybook | null;
    artifactVersionId: string | null;
  }>;
};

export type FrontendBuilder = {
  build(input: {
    brief: DesignBrief;
    research: BusinessResearch;
    strategy: UxContentStrategy;
    creative: CreativeDirection;
    assets: AssetPlan;
    defects?: string[];
  }): Promise<FrontendBuildResult>;
};

export type { DesignBrief } from "@/lib/design-brief/types";
export type { IndustryPlaybook } from "@/lib/playbooks/types";
