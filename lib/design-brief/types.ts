import type {
  AiAssetGenerationMode,
  AiAssetPermission,
  AssetCondition,
  BrandTrait,
  BriefSource,
  BuildType,
  ColorScaleKey,
  ContentBalance,
  CopyDensity,
  DesignMode,
  Effect,
  FormComplexity,
  Geometry,
  LogoStrategy,
  Motion,
  PaletteAuthority,
  PhotographyStrategy,
  PrimaryGoal,
  ShapeLanguage,
  SitePage,
  SiteFormat,
  Theme,
  TypographyCharacteristic,
  VisualComplexity,
  VisualScaleKey,
  VoiceOption,
} from "./constants";

export type BrandColor = {
  label: string;
  hex: string;
};

export type InspirationReference = {
  url: string;
  name: string;
  likedAspects: string[];
  notes: string;
};

export type AntiInspirationEntry = {
  url: string;
  name: string;
  dislikedAspects: string[];
  notes: string;
};

export type SiteFormatItem = {
  id: string;
  label: string;
};

export type DesignBrief = {
  schemaVersion: number;
  source: BriefSource;

  project: {
    businessName: string;
    industry: string;
    industrySubtype: string;
    businessLocation: string;
    existingWebsiteUrl: string;
    buildType: BuildType | "";
    description: string;
  };

  businessAudience: {
    businessDescription: string;
    servicesProducts: string[];
    primaryTargetCustomer: string;
    secondaryTargetCustomer: string;
    geographicMarket: string;
    typicalProjectValue: string;
    customerPriorities: string[];
    customerPainPoints: string[];
    commonObjections: string[];
    differentiators: string[];
    trustFactors: string[];
  };

  websiteGoals: {
    primaryGoal: PrimaryGoal | "";
    secondaryGoals: PrimaryGoal[];
    primaryCtaConcept: string;
    secondaryCtaConcept: string;
    primaryDesiredAction: string;
    firstImpression: string;
  };

  brandPersonality: {
    traits: BrandTrait[];
    description: string;
    desiredFeeling: string;
  };

  visualDirection: {
    scales: Record<VisualScaleKey, number>;
    theme: Theme | "";
    contentBalance: ContentBalance | "";
    designMode: DesignMode | "";
    geometry: Geometry | "";
    visualComplexity: VisualComplexity | "";
    notes: string;
  };

  colorDirection: {
    existingBrandColors: BrandColor[];
    requiredColors: string[];
    preferredColors: string[];
    avoidColors: string[];
    scales: Record<ColorScaleKey, number>;
    paletteAuthority: PaletteAuthority | "";
  };

  typography: {
    characteristics: TypographyCharacteristic[];
    largeDisplayPreference: boolean;
    uppercaseHeavyPreference: boolean;
    restraintLevel: number;
    requiredFonts: string[];
    avoidFonts: string[];
  };

  visualLanguage: {
    shapeLanguage: ShapeLanguage | "";
    effects: Effect[];
    motion: Motion | "";
    notes: string;
  };

  inspiration: {
    references: InspirationReference[];
    stylesToAvoid: string[];
    clichesToAvoid: string[];
    absolutelyNot: string;
  };

  antiInspiration: {
    entries: AntiInspirationEntry[];
  };

  assetStrategy: {
    brandAssetCondition: AssetCondition | "";
    logoStrategy: LogoStrategy | "";
    photography: PhotographyStrategy[];
    aiAssetPermissions: AiAssetPermission[];
    aiAssetGenerationMode: AiAssetGenerationMode | "";
  };

  contentDirection: {
    voice: VoiceOption[];
    desiredMessaging: string;
    importantPhrases: string[];
    phrasesToAvoid: string[];
    existingCopyAvailable: boolean;
    aiMayRewriteExistingCopy: boolean;
    aiMayCreateNewCopy: boolean;
    copyDensity: CopyDensity | "";
  };

  siteStructure: {
    pages: SitePage[];
    customPages: string[];
    requiredHomepageSections: string[];
    requestedSections: string[];
    creativeDirectorSections: string[];
  };

  siteFormat: {
    format: SiteFormat;
    suggestionSource: string;
    suggestedItems: string[];
    selectedItems: string[];
    customItems: SiteFormatItem[];
  };

  demoConversionUx: {
    primaryCtaConcept: string;
    secondaryCtaConcept: string;
    phoneCtaDesired: boolean;
    quoteFormDesired: boolean;
    bookingCtaDesired: boolean;
    portfolioEmphasis: boolean;
    reviewEmphasis: boolean;
    stickyMobileCta: boolean;
    persistentHeaderCta: boolean;
    formComplexity: FormComplexity | "";
  };

  creativeAuthority: {
    level: number;
  };

  hardConstraints: {
    mustInclude: string[];
    mustPreserve: string[];
    mustNotInclude: string[];
    brandRequirements: string[];
    accessibilityConsiderations: string[];
    otherNonNegotiables: string[];
  };

  creativeDirectorNotes: string;
};

export type DesignBriefProject = {
  id: string;
  slug: string;
  name: string;
  project_number: string | null;
  project_type: string | null;
  lifecycle_status: string | null;
  production_stage: string | null;
  description: string | null;
};
