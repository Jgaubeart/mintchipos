import test from "node:test";
import assert from "node:assert/strict";
import { HermesRuntime } from "../lib/execution/hermes/runtime";
import { normalizeStructuredOutput } from "../lib/execution/output";
import { validateAgentOutput } from "../lib/execution/validation";
import type { AgentExecutionRequest } from "../lib/execution/types";

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

function request(overrides: Partial<AgentExecutionRequest> = {}): AgentExecutionRequest {
  return {
    runId: "acceptance-run-1",
    projectId: "project-1",
    agentDefinitionId: "agent-1",
    agentDefinitionVersionId: "version-1",
    agentKey: "RESEARCH_STRATEGIST",
    instructions: "Produce a structured research foundation.",
    input: "Analyze the project and produce the initial research foundation.",
    projectContext: "Project context:\n- Name: Mint Chip Website",
    outputSchema: researchSchema,
    modelPolicyKey: null,
    allowedSkills: [],
    allowedTools: [],
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("local acceptance: async Hermes run normalizes and validates research output", async () => {
  process.env.HERMES_API_URL = "https://hermes.example/";
  process.env.HERMES_API_KEY = "test-key";

  let postPayload: Record<string, unknown> | undefined;

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      postPayload = JSON.parse(String(init.body)) as Record<string, unknown>;
      return jsonResponse(200, {
        run_id: "hermes-acceptance-run",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-acceptance-run",
      status: "completed",
      output: JSON.stringify(validResearchOutput),
      model: { name: "deepseek-v4-pro" },
      usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  const result = await runtime.execute(request());

  assert.ok(postPayload);
  assert.match(String(postPayload.instructions), /OUTPUT REQUIREMENTS/);

  const normalized = normalizeStructuredOutput(result.output, researchSchema);
  assert.deepEqual(normalized, validResearchOutput);

  const validation = validateAgentOutput(normalized, researchSchema);
  assert.equal(validation.ok, true);
});

test("local acceptance: alternate-field JSON output is rejected, not remapped", async () => {
  process.env.HERMES_API_URL = "https://hermes.example/";
  process.env.HERMES_API_KEY = "test-key";

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      return jsonResponse(200, {
        run_id: "hermes-acceptance-bad",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-acceptance-bad",
      status: "completed",
      output: JSON.stringify({
        project: { name: "Mint Chip Website" },
        research_gaps: ["Missing positioning detail."],
      }),
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  const result = await runtime.execute(request());
  const normalized = normalizeStructuredOutput(result.output, researchSchema);

  assert.equal(validateAgentOutput(normalized, researchSchema).ok, false);
});
