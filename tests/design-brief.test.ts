import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTHENTICITY_RULES,
  FIVE_PAGE_SUGGESTED_PAGES,
} from "../lib/design-brief/constants";
import {
  createEmptyDesignBrief,
  normalizeDesignBrief,
} from "../lib/design-brief/defaults";
import { buildDesignBriefSummary } from "../lib/design-brief/summary";
import type {
  DesignBrief,
  DesignBriefProject,
} from "../lib/design-brief/types";
import { validateDesignBrief } from "../lib/design-brief/validate";

const project: DesignBriefProject = {
  id: "project-1",
  slug: "mint-chip-website",
  name: "Mint Chip Website",
  project_number: "MC-0001",
  project_type: "INTERNAL",
  lifecycle_status: "ACTIVE",
  production_stage: "PLANNING",
  description: "A website for the Mint Chip brand.",
};

function validBrief() {
  const brief = createEmptyDesignBrief(project);
  brief.websiteGoals.primaryGoal = "GENERATE_LEADS";
  return brief;
}

test("valid Design Direction Brief passes validation", () => {
  assert.equal(validateDesignBrief(validBrief()).ok, true);
});

test("missing business name fails validation", () => {
  const brief = validBrief();
  brief.project.businessName = "";
  const result = validateDesignBrief(brief);
  assert.equal(result.ok, false);
});

test("invalid enum value fails validation", () => {
  const brief = validBrief();
  brief.websiteGoals.primaryGoal = "NOT_A_GOAL" as never;
  assert.equal(validateDesignBrief(brief).ok, false);
});

test("out-of-range scale value fails validation", () => {
  const brief = validBrief();
  brief.visualDirection.scales.minimalExpressive = 9;
  assert.equal(validateDesignBrief(brief).ok, false);
});

test("invalid creative authority level fails validation", () => {
  const brief = validBrief();
  brief.creativeAuthority.level = 6;
  assert.equal(validateDesignBrief(brief).ok, false);
});

test("non-object brief fails validation", () => {
  assert.equal(validateDesignBrief(null).ok, false);
  assert.equal(validateDesignBrief("nope").ok, false);
});

test("review summary is deterministic and derived from structured values", () => {
  const brief = validBrief();
  const summary = buildDesignBriefSummary(brief);

  assert.match(summary, /Mint Chip Website/);
  assert.match(summary, /Generate Leads/);
  assert.equal(summary, buildDesignBriefSummary(brief));
});

test("authenticity rules are immutable domain constants", () => {
  assert.ok(AUTHENTICITY_RULES.length > 0);
  assert.ok(AUTHENTICITY_RULES.includes("Do not invent testimonials or reviews."));
  assert.ok(AUTHENTICITY_RULES.includes("Do not invent factual business claims."));
});

test("FIVE_PAGE site format passes validation", () => {
  const brief = validBrief();
  brief.siteFormat.format = "FIVE_PAGE";
  brief.siteFormat.suggestedItems = [...FIVE_PAGE_SUGGESTED_PAGES];
  brief.siteFormat.selectedItems = [...FIVE_PAGE_SUGGESTED_PAGES];
  assert.equal(validateDesignBrief(brief).ok, true);
});

test("selected sections are preserved in site format", () => {
  const brief = validBrief();
  brief.siteFormat.selectedItems = ["Hero", "Services"];
  assert.equal(validateDesignBrief(brief).ok, true);
  assert.deepEqual(brief.siteFormat.selectedItems, ["Hero", "Services"]);
});

test("custom site format items pass validation", () => {
  const brief = validBrief();
  brief.siteFormat.customItems = [{ id: "custom-1", label: "Pricing" }];
  assert.equal(validateDesignBrief(brief).ok, true);
});

test("selected item outside suggested items fails validation", () => {
  const brief = validBrief();
  brief.siteFormat.selectedItems = ["Not Suggested"];
  assert.equal(validateDesignBrief(brief).ok, false);
});

test("invalid site format fails validation", () => {
  const brief = validBrief();
  brief.siteFormat.format = "TEN_PAGE" as never;
  assert.equal(validateDesignBrief(brief).ok, false);
});

test("backward compatibility: missing site format is normalized", () => {
  const brief = validBrief();
  const legacy = { ...brief } as Partial<DesignBrief>;
  delete (legacy as { siteFormat?: unknown }).siteFormat;

  const normalized = normalizeDesignBrief(legacy as DesignBrief);
  assert.equal(normalized.siteFormat.format, "ONE_PAGE");
  assert.equal(validateDesignBrief(normalized).ok, true);
});

test("review summary includes site format", () => {
  const brief = validBrief();
  assert.match(buildDesignBriefSummary(brief), /Site format: One page/);

  brief.siteFormat.format = "FIVE_PAGE";
  brief.siteFormat.suggestedItems = [...FIVE_PAGE_SUGGESTED_PAGES];
  brief.siteFormat.selectedItems = [...FIVE_PAGE_SUGGESTED_PAGES];
  assert.match(buildDesignBriefSummary(brief), /Site format: Five pages/);
});
