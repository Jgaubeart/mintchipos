import {
  AI_ASSET_GENERATION_MODES,
  AI_ASSET_PERMISSIONS,
  ASSET_CONDITIONS,
  BRAND_TRAITS,
  BRIEF_SOURCES,
  BUILD_TYPES,
  COLOR_SCALES,
  CONTENT_BALANCES,
  COPY_DENSITIES,
  DESIGN_BRIEF_SCHEMA_VERSION,
  DESIGN_MODES,
  EFFECTS,
  FORM_COMPLEXITIES,
  GEOMETRIES,
  LOGO_STRATEGIES,
  MOTIONS,
  PALETTE_AUTHORITIES,
  PHOTOGRAPHY_STRATEGIES,
  PRIMARY_GOALS,
  SHAPE_LANGUAGES,
  SITE_PAGES,
  THEMES,
  TYPOGRAPHY_CHARACTERISTICS,
  VISUAL_COMPLEXITIES,
  VISUAL_SCALES,
  VOICE_OPTIONS,
} from "./constants";
import type { DesignBrief } from "./types";

export type DesignBriefValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function validateDesignBrief(value: unknown): DesignBriefValidationResult {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Brief must be an object."] };
  }

  const brief = value as unknown as DesignBrief;
  const errors: string[] = [];

  if (brief.schemaVersion !== DESIGN_BRIEF_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${DESIGN_BRIEF_SCHEMA_VERSION}.`);
  }

  assertSingle(brief.source, BRIEF_SOURCES, "source", errors);

  if (!isString(brief.project?.businessName) || !brief.project.businessName.trim()) {
    errors.push("project.businessName is required.");
  }
  assertSingle(brief.project?.buildType, BUILD_TYPES, "project.buildType", errors);

  assertSingle(
    brief.websiteGoals?.primaryGoal,
    PRIMARY_GOALS,
    "websiteGoals.primaryGoal",
    errors,
  );
  assertEnumArray(
    brief.websiteGoals?.secondaryGoals,
    PRIMARY_GOALS,
    "websiteGoals.secondaryGoals",
    errors,
  );

  assertEnumArray(
    brief.brandPersonality?.traits,
    BRAND_TRAITS,
    "brandPersonality.traits",
    errors,
  );

  assertScaleRecord(brief.visualDirection?.scales, VISUAL_SCALES, "visualDirection.scales", errors);
  assertSingle(brief.visualDirection?.theme, THEMES, "visualDirection.theme", errors);
  assertSingle(brief.visualDirection?.contentBalance, CONTENT_BALANCES, "visualDirection.contentBalance", errors);
  assertSingle(brief.visualDirection?.designMode, DESIGN_MODES, "visualDirection.designMode", errors);
  assertSingle(brief.visualDirection?.geometry, GEOMETRIES, "visualDirection.geometry", errors);
  assertSingle(brief.visualDirection?.visualComplexity, VISUAL_COMPLEXITIES, "visualDirection.visualComplexity", errors);

  assertBrandColors(brief.colorDirection?.existingBrandColors, errors);
  assertScaleRecord(brief.colorDirection?.scales, COLOR_SCALES, "colorDirection.scales", errors);
  assertSingle(brief.colorDirection?.paletteAuthority, PALETTE_AUTHORITIES, "colorDirection.paletteAuthority", errors);

  assertEnumArray(
    brief.typography?.characteristics,
    TYPOGRAPHY_CHARACTERISTICS,
    "typography.characteristics",
    errors,
  );
  assertRange(brief.typography?.restraintLevel, "typography.restraintLevel", errors);

  assertSingle(brief.visualLanguage?.shapeLanguage, SHAPE_LANGUAGES, "visualLanguage.shapeLanguage", errors);
  assertEnumArray(brief.visualLanguage?.effects, EFFECTS, "visualLanguage.effects", errors);
  assertSingle(brief.visualLanguage?.motion, MOTIONS, "visualLanguage.motion", errors);

  assertSingle(brief.assetStrategy?.brandAssetCondition, ASSET_CONDITIONS, "assetStrategy.brandAssetCondition", errors);
  assertSingle(brief.assetStrategy?.logoStrategy, LOGO_STRATEGIES, "assetStrategy.logoStrategy", errors);
  assertEnumArray(brief.assetStrategy?.photography, PHOTOGRAPHY_STRATEGIES, "assetStrategy.photography", errors);
  assertEnumArray(brief.assetStrategy?.aiAssetPermissions, AI_ASSET_PERMISSIONS, "assetStrategy.aiAssetPermissions", errors);
  assertSingle(brief.assetStrategy?.aiAssetGenerationMode, AI_ASSET_GENERATION_MODES, "assetStrategy.aiAssetGenerationMode", errors);

  assertEnumArray(brief.contentDirection?.voice, VOICE_OPTIONS, "contentDirection.voice", errors);
  assertSingle(brief.contentDirection?.copyDensity, COPY_DENSITIES, "contentDirection.copyDensity", errors);

  assertEnumArray(brief.siteStructure?.pages, SITE_PAGES, "siteStructure.pages", errors);
  assertSingle(brief.demoConversionUx?.formComplexity, FORM_COMPLEXITIES, "demoConversionUx.formComplexity", errors);

  assertRange(brief.creativeAuthority?.level, "creativeAuthority.level", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}

function assertSingle(
  value: unknown,
  allowed: readonly string[],
  path: string,
  errors: string[],
): void {
  if (value === "" || value === null || value === undefined) {
    return;
  }
  if (typeof value !== "string" || !allowed.includes(value)) {
    errors.push(`${path} must be one of: ${allowed.join(", ")}.`);
  }
}

function assertEnumArray(
  value: unknown,
  allowed: readonly string[],
  path: string,
  errors: string[],
): void {
  if (value === undefined || value === null) {
    return;
  }
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }
  for (const item of value) {
    if (typeof item !== "string" || !allowed.includes(item)) {
      errors.push(`${path} contains an invalid value: ${String(item)}.`);
    }
  }
}

function assertRange(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    errors.push(`${path} must be an integer from 1 to 5.`);
  }
}

function assertScaleRecord(
  value: unknown,
  keys: readonly string[],
  path: string,
  errors: string[],
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  for (const key of keys) {
    if (typeof value[key] !== "number" || !Number.isInteger(value[key]) || value[key] < 1 || value[key] > 5) {
      errors.push(`${path}.${key} must be an integer from 1 to 5.`);
    }
  }
}

function assertBrandColors(value: unknown, errors: string[]): void {
  if (value === undefined || value === null) {
    return;
  }
  if (!Array.isArray(value)) {
    errors.push("colorDirection.existingBrandColors must be an array.");
    return;
  }
  for (const color of value) {
    if (!isRecord(color) || typeof color.hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color.hex)) {
      errors.push("existingBrandColors entries require a valid #RRGGBB hex.");
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
