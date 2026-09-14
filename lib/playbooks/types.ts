import type { ResearchQuestionTopic } from "./constants";

export type PlaybookBrief = {
  schemaVersion: number;
  industry: {
    industryName: string;
    industrySubtype: string;
    typicalBusinessSize: string;
    geographicFocus: string;
    notes: string;
  };
  targetMarket: {
    typicalTargetCustomer: string;
    typicalBuyerPriorities: string[];
    commonProductsServices: string[];
    primaryConversionGoals: string[];
  };
  researchScope: {
    numberOfReferenceSites: number;
    researchDirectCompetitors: boolean;
    researchPremiumExamples: boolean;
    researchAdjacentIndustries: boolean;
    researchLocalExamples: boolean;
    researchNationalExamples: boolean;
  };
  researchQuestions: ResearchQuestionTopic[];
  evidenceRequirements: {
    minimumSourceCount: number;
    sourceUrlsRequired: boolean;
    distinguishObservationFromRecommendation: boolean;
    distinguishFactFromInference: boolean;
    confidenceUncertaintyNotes: boolean;
    doNotInventUnsupportedClaims: boolean;
  };
};

export type EvidenceSource = {
  url: string;
  note: string;
};

export type IndustryPlaybook = {
  schemaVersion: number;
  industryName: string;
  industryOverview: string;
  typicalBusinessProfile: string;
  targetCustomer: string;
  buyingPsychology: string;
  customerPriorities: string[];
  painPoints: string[];
  commonObjections: string[];
  trustSignals: string[];
  primaryConversionGoals: string[];
  ctaPatterns: string[];
  onePageStructure: string[];
  fivePageStructure: string[];
  contentStrategy: string;
  messagingGuidance: string;
  visualDesignGuidance: string;
  typographyGuidance: string;
  colorGuidance: string;
  photographyAssetGuidance: string;
  aiAssetOpportunities: string[];
  motionInteractionGuidance: string;
  mobilePriorities: string[];
  seoLocalSearchGuidance: string;
  accessibilityComplianceNotes: string[];
  commonWebsiteMistakes: string[];
  designClichesToAvoid: string[];
  creativeOpportunities: string[];
  evidenceSources: EvidenceSource[];
  confidenceAssumptions: string[];
};
