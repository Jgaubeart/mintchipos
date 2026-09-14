export const DESIGN_BRIEF_SCHEMA_VERSION = 1;
export const DESIGN_BRIEF_ARTIFACT_TYPE = "DESIGN_DIRECTION_BRIEF";
export const DESIGN_BRIEF_TITLE = "Design Direction Brief";

export const BRIEF_SOURCES = ["OWNER_MINT_CHIP", "CUSTOMER", "AGENT"] as const;
export type BriefSource = (typeof BRIEF_SOURCES)[number];

export const BUILD_TYPES = ["NEW_WEBSITE", "REDESIGN", "CONCEPT_DEMO"] as const;
export type BuildType = (typeof BUILD_TYPES)[number];

export const PRIMARY_GOALS = [
  "GENERATE_LEADS",
  "PHONE_CALLS",
  "QUOTE_REQUESTS",
  "BOOK_APPOINTMENTS",
  "RESERVATIONS",
  "ECOMMERCE",
  "SHOWCASE_PORTFOLIO",
  "ESTABLISH_CREDIBILITY",
  "PROVIDE_INFORMATION",
  "RECRUITING",
  "OTHER",
] as const;
export type PrimaryGoal = (typeof PRIMARY_GOALS)[number];

export const BRAND_TRAITS = [
  "PREMIUM",
  "APPROACHABLE",
  "PLAYFUL",
  "SOPHISTICATED",
  "BOLD",
  "MINIMAL",
  "WARM",
  "TRUSTWORTHY",
  "TECHNICAL",
  "EDITORIAL",
  "ENERGETIC",
  "CALM",
  "LUXURY",
  "RUGGED",
  "LOCAL",
  "FUTURISTIC",
  "ARTISTIC",
  "PROFESSIONAL",
  "EXPERIMENTAL",
  "FRIENDLY",
] as const;
export type BrandTrait = (typeof BRAND_TRAITS)[number];

export const VISUAL_SCALES = [
  "minimalExpressive",
  "conventionalExperimental",
  "quietBold",
  "traditionalFuturistic",
  "corporatePlayful",
  "denseSpacious",
  "flatLayered",
  "symmetricalAsymmetrical",
] as const;
export type VisualScaleKey = (typeof VISUAL_SCALES)[number];

export const THEMES = ["LIGHT", "DARK", "MIXED"] as const;
export type Theme = (typeof THEMES)[number];

export const CONTENT_BALANCES = ["IMAGE_HEAVY", "BALANCED", "CONTENT_HEAVY"] as const;
export type ContentBalance = (typeof CONTENT_BALANCES)[number];

export const DESIGN_MODES = ["EDITORIAL", "COMMERCIAL", "HYBRID"] as const;
export type DesignMode = (typeof DESIGN_MODES)[number];

export const GEOMETRIES = ["SHARP", "ROUNDED", "MIXED"] as const;
export type Geometry = (typeof GEOMETRIES)[number];

export const VISUAL_COMPLEXITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type VisualComplexity = (typeof VISUAL_COMPLEXITIES)[number];

export const COLOR_SCALES = [
  "warmCool",
  "mutedSaturated",
  "softHighContrast",
  "monochromeMulticolor",
] as const;
export type ColorScaleKey = (typeof COLOR_SCALES)[number];

export const PALETTE_AUTHORITIES = [
  "PRESERVE",
  "EVOLVE",
  "PROPOSE_NEW",
  "FULL_FREEDOM",
] as const;
export type PaletteAuthority = (typeof PALETTE_AUTHORITIES)[number];

export const TYPOGRAPHY_CHARACTERISTICS = [
  "MODERN_SANS",
  "GEOMETRIC",
  "HUMANIST",
  "EDITORIAL_SERIF",
  "LUXURY_SERIF",
  "INDUSTRIAL",
  "TECHNICAL",
  "PLAYFUL",
  "CONDENSED",
  "EXPERIMENTAL",
] as const;
export type TypographyCharacteristic =
  (typeof TYPOGRAPHY_CHARACTERISTICS)[number];

export const SHAPE_LANGUAGES = [
  "SHARP",
  "ROUNDED",
  "ORGANIC",
  "GEOMETRIC",
  "MIXED",
] as const;
export type ShapeLanguage = (typeof SHAPE_LANGUAGES)[number];

export const EFFECTS = [
  "GRADIENTS",
  "GRAIN_TEXTURE",
  "SHADOWS",
  "GLASS_TRANSLUCENCY",
  "BORDERS",
  "LARGE_TYPOGRAPHY",
  "OVERSIZED_IMAGERY",
  "THREE_D",
  "ILLUSTRATION",
  "CUSTOM_ICONS",
  "ABSTRACT_GRAPHICS",
  "PATTERNS",
] as const;
export type Effect = (typeof EFFECTS)[number];

export const MOTIONS = ["NONE", "SUBTLE", "MODERATE", "EXPRESSIVE"] as const;
export type Motion = (typeof MOTIONS)[number];

export const ASSET_CONDITIONS = [
  "COMPLETE_BRAND",
  "PARTIAL_BRAND",
  "LOGO_ONLY",
  "NO_USABLE_BRAND",
  "UNKNOWN",
] as const;
export type AssetCondition = (typeof ASSET_CONDITIONS)[number];

export const LOGO_STRATEGIES = [
  "EXISTING_LOGO",
  "TEXT_WORDMARK",
  "GENERATE_TEMPORARY_DEMO_MARK",
  "GENERATE_ALTERNATE_MARK",
  "BRAND_IDENTITY_REQUIRED",
] as const;
export type LogoStrategy = (typeof LOGO_STRATEGIES)[number];

export const PHOTOGRAPHY_STRATEGIES = [
  "CUSTOMER_PHOTOGRAPHY_AVAILABLE",
  "EXISTING_BUSINESS_IMAGERY_AVAILABLE",
  "STOCK_ALLOWED",
  "AI_IMAGERY_ALLOWED",
  "DEMO_ONLY_IMAGERY",
  "AUTHENTIC_PHOTOGRAPHY_REQUIRED_BEFORE_PRODUCTION",
] as const;
export type PhotographyStrategy = (typeof PHOTOGRAPHY_STRATEGIES)[number];

export const AI_ASSET_PERMISSIONS = [
  "ALTERNATE_LOGO",
  "HERO_ARTWORK",
  "DECORATIVE_GRAPHICS",
  "BACKGROUND_TEXTURES",
  "CUSTOM_ILLUSTRATIONS",
  "ICONS",
  "PATTERNS",
  "PRODUCT_SERVICE_IMAGERY",
  "LIFESTYLE_IMAGERY",
  "ENVIRONMENT_IMAGERY",
  "SOCIAL_OG_GRAPHICS",
  "MOTION_ASSETS",
] as const;
export type AiAssetPermission = (typeof AI_ASSET_PERMISSIONS)[number];

export const AI_ASSET_GENERATION_MODES = [
  "NEVER",
  "ONLY_IF_MISSING",
  "CREATIVE_DIRECTOR_DISCRETION",
  "ENCOURAGED",
] as const;
export type AiAssetGenerationMode = (typeof AI_ASSET_GENERATION_MODES)[number];

export const VOICE_OPTIONS = [
  "PROFESSIONAL",
  "CONVERSATIONAL",
  "AUTHORITATIVE",
  "FRIENDLY",
  "PREMIUM",
  "ENERGETIC",
  "TECHNICAL",
  "PLAYFUL",
  "DIRECT",
  "EDITORIAL",
] as const;
export type VoiceOption = (typeof VOICE_OPTIONS)[number];

export const COPY_DENSITIES = ["MINIMAL", "MODERATE", "DETAILED"] as const;
export type CopyDensity = (typeof COPY_DENSITIES)[number];

export const SITE_PAGES = [
  "HOME",
  "ABOUT",
  "SERVICES",
  "INDIVIDUAL_SERVICE_PAGES",
  "PORTFOLIO_PROJECTS",
  "GALLERY",
  "REVIEWS",
  "PROCESS",
  "TEAM",
  "PRICING",
  "FAQ",
  "CONTACT",
  "BLOG",
  "LOCATIONS",
  "CAREERS",
  "CUSTOM",
] as const;
export type SitePage = (typeof SITE_PAGES)[number];

export const FORM_COMPLEXITIES = ["NONE", "SIMPLE", "MODERATE", "MULTI_STEP"] as const;
export type FormComplexity = (typeof FORM_COMPLEXITIES)[number];

export const CREATIVE_AUTHORITY_LEVELS: {
  level: number;
  key: string;
  label: string;
  description: string;
}[] = [
  { level: 1, key: "STRICT", label: "Strict", description: "Follow the brief exactly; do not deviate." },
  { level: 2, key: "GUIDED", label: "Guided", description: "Follow the brief closely with minor refinement." },
  { level: 3, key: "BALANCED", label: "Balanced", description: "Use the brief as direction with reasonable creative latitude." },
  { level: 4, key: "HIGH_FREEDOM", label: "High Freedom", description: "Treat the brief as a starting point; make substantial creative choices." },
  { level: 5, key: "FULL_CREATIVE_DIRECTION", label: "Full Creative Direction", description: "The Creative Director owns the outcome; the brief is advisory." },
];

export const AUTHENTICITY_RULES = [
  "Decorative synthetic assets may be allowed.",
  "Representative demo imagery may be allowed when explicitly identified as demo content.",
  "Do not invent completed customer projects as factual work.",
  "Do not invent employees.",
  "Do not invent testimonials or reviews.",
  "Do not invent awards or certifications.",
  "Do not invent factual business claims.",
] as const;

export function humanizeToken(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
