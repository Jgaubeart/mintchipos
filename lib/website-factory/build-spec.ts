import type {
  AssetPlan,
  BusinessResearch,
  CreativeDirection,
  DesignBrief,
  UxContentStrategy,
} from "./types";

export type FrontendBuildSpec = {
  businessName: string;
  websiteUrl: string | null;
  valueProposition: string | null;
  description: string | null;
  services: string[];
  siteFormat: "ONE_PAGE" | "FIVE_PAGE";
  sections: string[];
  headline: string;
  centralVisualConcept: string;
  sectionOrder: string[];
  colorApplication: string;
  typographySystem: string;
  cta: string;
  requiredColors: string[];
  motionDirection: string;
  demoDisclaimer: boolean;
};

export function buildFrontendBuildSpec(input: {
  brief: DesignBrief;
  research: BusinessResearch;
  strategy: UxContentStrategy;
  creative: CreativeDirection;
  assets: AssetPlan;
}): FrontendBuildSpec {
  return {
    businessName: input.brief.project.businessName,
    websiteUrl: input.research.websiteUrl,
    valueProposition: input.research.valueProposition,
    description: input.research.description,
    services:
      input.research.services.length > 0
        ? input.research.services
        : ["Managed website service"],
    siteFormat: input.brief.siteFormat.format,
    sections: input.strategy.sectionSequence,
    headline: input.strategy.headlineStrategy,
    centralVisualConcept: input.creative.centralVisualConcept,
    sectionOrder: input.creative.sectionOrder,
    colorApplication: input.creative.colorApplication,
    typographySystem: input.creative.typographySystem,
    cta: input.brief.demoConversionUx.primaryCtaConcept,
    requiredColors: input.brief.colorDirection.requiredColors,
    motionDirection: input.creative.motionDirection,
    demoDisclaimer: true,
  };
}

