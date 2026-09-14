import test from "node:test";
import assert from "node:assert/strict";
import { buildProjectContext } from "../lib/execution/context";
import { normalizeStructuredOutput } from "../lib/execution/output";
import { buildStructuredOutputInstructions } from "../lib/execution/prompt";
import {
  RESEARCH_ARTIFACT_TYPE,
  RESEARCH_STRATEGIST_KEY,
  shouldPersistResearchArtifact,
} from "../lib/execution/research";
import { validateAgentOutput } from "../lib/execution/validation";

const researchSchema: Record<string, unknown> = {
  type: "object",
  required: [
    "executive_summary",
    "business_context",
    "research_questions",
    "known_facts",
    "assumptions",
    "opportunities",
    "risks",
    "recommended_next_steps",
  ],
  properties: {
    executive_summary: { type: "string" },
    business_context: {
      type: "object",
      required: ["business_name", "project_goal", "target_customer"],
      properties: {
        business_name: { type: "string" },
        project_goal: { type: "string" },
        target_customer: { type: "string" },
      },
    },
    research_questions: { type: "array", items: { type: "string" } },
    known_facts: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    recommended_next_steps: { type: "array", items: { type: "string" } },
  },
};

const validResearchOutput = {
  executive_summary: "Initial research foundation.",
  business_context: {
    business_name: "Mint Chip",
    project_goal: "Launch the Mint Chip website.",
    target_customer: "Internal stakeholders",
  },
  research_questions: ["What is the primary value proposition?"],
  known_facts: ["The project is named Mint Chip Website."],
  assumptions: ["The audience prefers concise content."],
  opportunities: ["Establish a clear brand position."],
  risks: ["Limited existing research."],
  recommended_next_steps: ["Validate assumptions with stakeholders."],
};

test("buildProjectContext includes the relevant project fields", () => {
  const context = buildProjectContext({
    project_number: "MC-0001",
    name: "Mint Chip Website",
    slug: "mint-chip-website",
    project_type: "INTERNAL",
    lifecycle_status: "ACTIVE",
    production_stage: "PLANNING",
    description: "A website for the Mint Chip brand.",
  });

  assert.match(context, /MC-0001/);
  assert.match(context, /Mint Chip Website/);
  assert.match(context, /mint-chip-website/);
  assert.match(context, /INTERNAL/);
  assert.match(context, /ACTIVE/);
  assert.match(context, /PLANNING/);
  assert.match(context, /A website for the Mint Chip brand/);
});

test("valid structured research output passes schema validation", () => {
  assert.equal(validateAgentOutput(validResearchOutput, researchSchema).ok, true);
});

test("invalid structured research output fails schema validation", () => {
  assert.equal(
    validateAgentOutput({ executive_summary: "missing fields" }, researchSchema).ok,
    false,
  );
});

test("wrongly typed research field fails schema validation", () => {
  assert.equal(
    validateAgentOutput(
      { ...validResearchOutput, research_questions: [123] },
      researchSchema,
    ).ok,
    false,
  );
});

test("generic agents without a schema still accept any non-null output", () => {
  assert.equal(validateAgentOutput("plain string").ok, true);
  assert.equal(validateAgentOutput({ any: "shape" }).ok, true);
  assert.equal(validateAgentOutput([1, 2, 3]).ok, true);
  assert.equal(validateAgentOutput(null).ok, false);
});

test("only the Research Strategist triggers research artifact persistence", () => {
  assert.equal(shouldPersistResearchArtifact(RESEARCH_STRATEGIST_KEY), true);
  assert.equal(shouldPersistResearchArtifact("CREATIVE_DIRECTOR"), false);
  assert.equal(RESEARCH_ARTIFACT_TYPE, "RESEARCH");
});

test("normalizeStructuredOutput returns unchanged without a schema", () => {
  assert.equal(normalizeStructuredOutput("plain text"), "plain text");
  assert.deepEqual(normalizeStructuredOutput({ a: 1 }), { a: 1 });
  assert.deepEqual(normalizeStructuredOutput([1, 2]), [1, 2]);
});

test("normalizeStructuredOutput parses JSON text into native JSON", () => {
  const json = JSON.stringify(validResearchOutput);

  assert.deepEqual(
    normalizeStructuredOutput(json, researchSchema),
    validResearchOutput,
  );
});

test("normalizeStructuredOutput extracts a fenced JSON block", () => {
  const fenced = `Here is the result:\n\`\`\`json\n${JSON.stringify(
    validResearchOutput,
  )}\n\`\`\``;

  assert.deepEqual(
    normalizeStructuredOutput(fenced, researchSchema),
    validResearchOutput,
  );
});

test("normalizeStructuredOutput leaves native values unchanged", () => {
  assert.deepEqual(
    normalizeStructuredOutput(validResearchOutput, researchSchema),
    validResearchOutput,
  );
  assert.deepEqual(normalizeStructuredOutput([1, 2], researchSchema), [1, 2]);
  assert.equal(normalizeStructuredOutput(42, researchSchema), 42);
  assert.equal(normalizeStructuredOutput(true, researchSchema), true);
});

test("normalizeStructuredOutput leaves unparseable strings unchanged", () => {
  assert.equal(
    normalizeStructuredOutput("not valid json", researchSchema),
    "not valid json",
  );
});

test("JSON text output normalizes and passes schema validation", () => {
  const normalized = normalizeStructuredOutput(
    JSON.stringify(validResearchOutput),
    researchSchema,
  );

  assert.equal(validateAgentOutput(normalized, researchSchema).ok, true);
});

test("structured-output prompt includes the schema and required fields", () => {
  const prompt = buildStructuredOutputInstructions(researchSchema);

  assert.match(prompt, /OUTPUT REQUIREMENTS/);
  assert.match(prompt, /Return ONLY valid JSON/);
  assert.match(prompt, /Do not use markdown/);
  assert.match(prompt, /executive_summary/);
  assert.match(prompt, /business_context/);
  assert.match(prompt, /research_questions/);
  assert.match(prompt, /recommended_next_steps/);
  assert.match(prompt, /Required top-level fields:/);
});

test("alternate-field research object fails schema validation", () => {
  const alternate = {
    project: { name: "Mint Chip Website" },
    known_facts: ["The project is named Mint Chip Website."],
    assumptions: [],
    research_gaps: ["Missing positioning detail."],
    downstream_guidance: { creative: "Focus on the brand." },
    recommended_next_steps: ["Validate assumptions."],
    confidence: "medium",
  };

  assert.equal(validateAgentOutput(alternate, researchSchema).ok, false);
});
