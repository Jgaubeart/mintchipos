import test from "node:test";
import assert from "node:assert/strict";
import { AUTHENTICITY_RULES } from "../lib/design-brief/constants";
import { createEmptyDesignBrief } from "../lib/design-brief/defaults";
import { buildDesignBriefSummary } from "../lib/design-brief/summary";
import type { DesignBriefProject } from "../lib/design-brief/types";
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
