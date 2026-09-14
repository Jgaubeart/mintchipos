import { CREATIVE_AUTHORITY_LEVELS, humanizeToken } from "./constants";
import type { DesignBrief } from "./types";

export function buildDesignBriefSummary(brief: DesignBrief): string {
  const lines: string[] = [];

  lines.push(`Business: ${brief.project.businessName.trim() || "Unnamed"}`);

  const industry = [brief.project.industry, brief.project.industrySubtype]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
  if (industry) {
    lines.push(`Industry: ${industry}`);
  }
  if (brief.project.buildType) {
    lines.push(`Build type: ${humanizeToken(brief.project.buildType)}`);
  }

  if (brief.websiteGoals.primaryGoal) {
    lines.push(`Primary goal: ${humanizeToken(brief.websiteGoals.primaryGoal)}`);
  }
  if (brief.websiteGoals.primaryDesiredAction.trim()) {
    lines.push(`Desired action: ${brief.websiteGoals.primaryDesiredAction.trim()}`);
  }

  if (brief.brandPersonality.traits.length > 0) {
    lines.push(
      `Brand personality: ${brief.brandPersonality.traits
        .map((trait) => humanizeToken(trait))
        .join(", ")}`,
    );
  }

  lines.push(
    `Visual direction: ${brief.visualDirection.theme.toLowerCase()} theme, ${brief.visualDirection.geometry.toLowerCase()} geometry, ${brief.visualDirection.designMode.toLowerCase()} mode`,
  );

  if (brief.colorDirection.paletteAuthority) {
    lines.push(
      `Palette authority: ${humanizeToken(brief.colorDirection.paletteAuthority)}`,
    );
  }

  if (brief.typography.characteristics.length > 0) {
    lines.push(
      `Typography: ${brief.typography.characteristics
        .map((item) => humanizeToken(item))
        .join(", ")}`,
    );
  }

  if (brief.visualLanguage.shapeLanguage) {
    lines.push(
      `Shape language: ${humanizeToken(brief.visualLanguage.shapeLanguage)}`,
    );
  }
  if (brief.visualLanguage.motion) {
    lines.push(`Motion: ${humanizeToken(brief.visualLanguage.motion)}`);
  }

  if (brief.contentDirection.voice.length > 0) {
    lines.push(
      `Voice: ${brief.contentDirection.voice.map(humanizeToken).join(", ")}`,
    );
  }

  const authority = CREATIVE_AUTHORITY_LEVELS.find(
    (level) => level.level === brief.creativeAuthority.level,
  );
  if (authority) {
    lines.push(`Creative authority: ${authority.label}`);
  }

  if (brief.hardConstraints.mustNotInclude.length > 0) {
    lines.push(
      `Avoid: ${brief.hardConstraints.mustNotInclude.join("; ")}`,
    );
  }

  return lines.join("\n");
}
