import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyPlaybookBrief, validatePlaybookBrief } from "../lib/playbooks/brief";
import {
  INDUSTRY_PLAYBOOK_OUTPUT_SCHEMA,
  buildIndustryPlaybookSummary,
  validateIndustryPlaybook,
} from "../lib/playbooks/playbook";
import type { IndustryPlaybook, PlaybookBrief } from "../lib/playbooks/types";

function validBrief(): PlaybookBrief {
  const brief = createEmptyPlaybookBrief();
  brief.industry.industryName = "AI Website Design";
  brief.industry.industrySubtype = "Managed Website Service";
  return brief;
}

function validPlaybook(): IndustryPlaybook {
  return {
    schemaVersion: 1,
    industryName: "AI Website Design",
    industryOverview: "A short overview.",
    typicalBusinessProfile: "Small local businesses.",
    targetCustomer: "Business owners.",
    buyingPsychology: "They want low-effort results.",
    customerPriorities: ["Speed", "Quality"],
    painPoints: ["Cost", "Complexity"],
    commonObjections: ["Too expensive"],
    trustSignals: ["Reviews"],
    primaryConversionGoals: ["GENERATE_LEADS"],
    ctaPatterns: ["Request a site"],
    onePageStructure: ["Hero", "Services", "Contact"],
    fivePageStructure: ["Home", "Services", "Portfolio", "About", "Contact"],
    contentStrategy: "Lead with outcomes.",
    messagingGuidance: "Clear and direct.",
    visualDesignGuidance: "Modern and clean.",
    typographyGuidance: "Modern sans.",
    colorGuidance: "Muted with accent.",
    photographyAssetGuidance: "Use AI demo imagery.",
    aiAssetOpportunities: ["Hero artwork"],
    motionInteractionGuidance: "Subtle.",
    mobilePriorities: ["Speed"],
    seoLocalSearchGuidance: "Optimize local terms.",
    accessibilityComplianceNotes: ["WCAG AA"],
    commonWebsiteMistakes: ["Overlong copy"],
    designClichesToAvoid: ["Generic stock"],
    creativeOpportunities: ["Interactive preview"],
    evidenceSources: [{ url: "https://example.com", note: "Reference site" }],
    confidenceAssumptions: ["Assumes small business market"],
  };
}

test("valid Playbook Brief passes validation", () => {
  assert.equal(validatePlaybookBrief(validBrief()).ok, true);
});

test("Playbook Brief requires industry name", () => {
  const brief = validBrief();
  brief.industry.industryName = "";
  assert.equal(validatePlaybookBrief(brief).ok, false);
});

test("Playbook Brief rejects invalid research question topics", () => {
  const brief = validBrief();
  brief.researchQuestions = ["NOT_A_TOPIC" as never];
  assert.equal(validatePlaybookBrief(brief).ok, false);
});

test("Playbook Brief rejects invalid source count", () => {
  const brief = validBrief();
  brief.evidenceRequirements.minimumSourceCount = 0;
  assert.equal(validatePlaybookBrief(brief).ok, false);
});

test("valid Industry Playbook passes validation", () => {
  assert.equal(validateIndustryPlaybook(validPlaybook()).ok, true);
});

test("Industry Playbook requires all canonical sections", () => {
  const playbook = validPlaybook() as Partial<IndustryPlaybook>;
  delete (playbook as { onePageStructure?: unknown }).onePageStructure;
  assert.equal(validateIndustryPlaybook(playbook).ok, false);
});

test("Industry Playbook rejects alternate field names", () => {
  const playbook = validPlaybook() as Record<string, unknown>;
  delete playbook.industryOverview;
  playbook.overview = "renamed";
  assert.equal(validateIndustryPlaybook(playbook).ok, false);
});

test("Industry Playbook output schema includes canonical fields", () => {
  const required = INDUSTRY_PLAYBOOK_OUTPUT_SCHEMA.required as string[];
  assert.ok(required.includes("industryOverview"));
  assert.ok(required.includes("onePageStructure"));
  assert.ok(required.includes("fivePageStructure"));
  assert.ok(required.includes("evidenceSources"));
});

test("Industry Playbook summary is deterministic", () => {
  const playbook = validPlaybook();
  const summary = buildIndustryPlaybookSummary(playbook);
  assert.match(summary, /AI Website Design/);
  assert.match(summary, /Hero → Services → Contact/);
  assert.equal(summary, buildIndustryPlaybookSummary(playbook));
});
