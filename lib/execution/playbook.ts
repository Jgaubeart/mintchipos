import { validatePlaybookBrief } from "@/lib/playbooks/brief";
import { INDUSTRY_PLAYBOOK_OUTPUT_SCHEMA } from "@/lib/playbooks/playbook";
import type { PlaybookBrief } from "@/lib/playbooks/types";

export const PLAYBOOK_RESEARCH_KIND = "PLAYBOOK_RESEARCH";

export const PLAYBOOK_RESEARCH_INSTRUCTIONS = [
  "You are the Research Strategist for MintChipOS. Research the given industry and produce a structured industry website playbook.",
  "Work from verifiable sources. Distinguish sourced facts from recommendations, and clearly flag uncertainty and assumptions.",
  "Do not invent statistics, testimonials, awards, or factual claims. Do not copy website text or designs; synthesize patterns.",
  "Return only the structured object matching your output schema. Do not include markdown or explanatory prose around the JSON.",
].join("\n");

export function detectPlaybookResearchInput(
  snapshot: unknown,
): PlaybookBrief | null {
  if (!isRecord(snapshot) || snapshot.kind !== PLAYBOOK_RESEARCH_KIND) {
    return null;
  }

  const brief = snapshot.brief;
  if (validatePlaybookBrief(brief).ok) {
    return brief as PlaybookBrief;
  }

  return null;
}

export function buildPlaybookResearchMessage(brief: PlaybookBrief): string {
  const lines = [
    "Research the following industry and produce a structured industry website playbook.",
    "",
    `Industry: ${brief.industry.industryName.trim()}`,
  ];

  if (brief.industry.industrySubtype.trim()) {
    lines.push(`Subtype: ${brief.industry.industrySubtype.trim()}`);
  }
  if (brief.industry.typicalBusinessSize.trim()) {
    lines.push(`Typical business size: ${brief.industry.typicalBusinessSize.trim()}`);
  }
  if (brief.industry.geographicFocus.trim()) {
    lines.push(`Geographic focus: ${brief.industry.geographicFocus.trim()}`);
  }
  if (brief.targetMarket.typicalTargetCustomer.trim()) {
    lines.push(`Target customer: ${brief.targetMarket.typicalTargetCustomer.trim()}`);
  }
  if (brief.industry.notes.trim()) {
    lines.push(`Notes: ${brief.industry.notes.trim()}`);
  }

  lines.push(
    "",
    `Minimum sources required: ${brief.evidenceRequirements.minimumSourceCount}.`,
    "Use only verifiable, sourced observations. Do not invent statistics or claims.",
  );

  return lines.join("\n");
}

export function playbookOutputSchema(): Record<string, unknown> {
  return INDUSTRY_PLAYBOOK_OUTPUT_SCHEMA;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
