import { DESIGN_BRIEF_SCHEMA_VERSION } from "./constants";
import type { DesignBrief, DesignBriefProject } from "./types";

export function createEmptyDesignBrief(
  project: DesignBriefProject,
): DesignBrief {
  return {
    schemaVersion: DESIGN_BRIEF_SCHEMA_VERSION,
    source: "OWNER_MINT_CHIP",

    project: {
      businessName: project.name,
      industry: "",
      industrySubtype: "",
      businessLocation: "",
      existingWebsiteUrl: "",
      buildType: "NEW_WEBSITE",
      description: project.description ?? "",
    },

    businessAudience: {
      businessDescription: "",
      servicesProducts: [],
      primaryTargetCustomer: "",
      secondaryTargetCustomer: "",
      geographicMarket: "",
      typicalProjectValue: "",
      customerPriorities: [],
      customerPainPoints: [],
      commonObjections: [],
      differentiators: [],
      trustFactors: [],
    },

    websiteGoals: {
      primaryGoal: "",
      secondaryGoals: [],
      primaryCtaConcept: "",
      secondaryCtaConcept: "",
      primaryDesiredAction: "",
      firstImpression: "",
    },

    brandPersonality: {
      traits: [],
      description: "",
      desiredFeeling: "",
    },

    visualDirection: {
      scales: {
        minimalExpressive: 3,
        conventionalExperimental: 3,
        quietBold: 3,
        traditionalFuturistic: 3,
        corporatePlayful: 3,
        denseSpacious: 3,
        flatLayered: 3,
        symmetricalAsymmetrical: 3,
      },
      theme: "MIXED",
      contentBalance: "BALANCED",
      designMode: "HYBRID",
      geometry: "MIXED",
      visualComplexity: "MEDIUM",
      notes: "",
    },

    colorDirection: {
      existingBrandColors: [],
      requiredColors: [],
      preferredColors: [],
      avoidColors: [],
      scales: {
        warmCool: 3,
        mutedSaturated: 3,
        softHighContrast: 3,
        monochromeMulticolor: 3,
      },
      paletteAuthority: "PROPOSE_NEW",
    },

    typography: {
      characteristics: [],
      largeDisplayPreference: false,
      uppercaseHeavyPreference: false,
      restraintLevel: 3,
      requiredFonts: [],
      avoidFonts: [],
    },

    visualLanguage: {
      shapeLanguage: "MIXED",
      effects: [],
      motion: "SUBTLE",
      notes: "",
    },

    inspiration: {
      references: [],
      stylesToAvoid: [],
      clichesToAvoid: [],
      absolutelyNot: "",
    },

    antiInspiration: {
      entries: [],
    },

    assetStrategy: {
      brandAssetCondition: "UNKNOWN",
      logoStrategy: "GENERATE_TEMPORARY_DEMO_MARK",
      photography: [],
      aiAssetPermissions: [],
      aiAssetGenerationMode: "CREATIVE_DIRECTOR_DISCRETION",
    },

    contentDirection: {
      voice: [],
      desiredMessaging: "",
      importantPhrases: [],
      phrasesToAvoid: [],
      existingCopyAvailable: false,
      aiMayRewriteExistingCopy: false,
      aiMayCreateNewCopy: true,
      copyDensity: "MODERATE",
    },

    siteStructure: {
      pages: ["HOME"],
      customPages: [],
      requiredHomepageSections: [],
      requestedSections: [],
      creativeDirectorSections: [],
    },

    demoConversionUx: {
      primaryCtaConcept: "",
      secondaryCtaConcept: "",
      phoneCtaDesired: false,
      quoteFormDesired: false,
      bookingCtaDesired: false,
      portfolioEmphasis: false,
      reviewEmphasis: false,
      stickyMobileCta: false,
      persistentHeaderCta: false,
      formComplexity: "SIMPLE",
    },

    creativeAuthority: {
      level: 3,
    },

    hardConstraints: {
      mustInclude: [],
      mustPreserve: [],
      mustNotInclude: [],
      brandRequirements: [],
      accessibilityConsiderations: [],
      otherNonNegotiables: [],
    },

    creativeDirectorNotes: "",
  };
}
