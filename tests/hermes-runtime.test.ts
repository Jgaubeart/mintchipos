import test from "node:test";
import assert from "node:assert/strict";
import { HermesClient } from "../lib/execution/hermes/client";
import { HermesRuntime } from "../lib/execution/hermes/runtime";
import { extractUserMessage } from "../lib/execution/input";
import type { AgentExecutionRequest } from "../lib/execution/types";

function request(overrides: Partial<AgentExecutionRequest> = {}): AgentExecutionRequest {
  return {
    runId: "mint-run-1",
    projectId: "project-1",
    agentDefinitionId: "agent-1",
    agentDefinitionVersionId: "agent-version-1",
    agentKey: "RESEARCH_STRATEGIST",
    instructions: "Bounded acknowledgement instructions.",
    input: "Reply with exactly: MINTCHIPOS_HERMES_OK",
    outputSchema: {
      type: "object",
    },
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

function setupEnv() {
  process.env.HERMES_API_URL = "https://hermes.example/";
  process.env.HERMES_API_KEY = "test-key";
}

test("successful async run polls started -> running -> completed", async () => {
  setupEnv();
  let getCount = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);

    if (init?.method === "POST") {
      assert.equal(url, "https://hermes.example/v1/runs");
      return jsonResponse(200, {
        run_id: "hermes-run-1",
        status: "started",
        replayed: false,
      });
    }

    getCount += 1;

    if (getCount === 1) {
      return jsonResponse(200, {
        run_id: "hermes-run-1",
        status: "running",
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-1",
      status: "completed",
      output: {
        acknowledged: true,
        projectName: "MC-0001 — Mint Chip Website",
        summary: "acknowledged",
      },
      model: {
        provider: "deepseek",
        name: "deepseek-v4-pro",
      },
      usage: {
        input_tokens: 12,
        output_tokens: 8,
        total_tokens: 20,
      },
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  const result = await runtime.execute(request());

  assert.equal(result.runtimeRunId, "hermes-run-1");
  assert.equal(result.modelName, "deepseek-v4-pro");
  assert.equal(result.modelProvider, "deepseek");
  assert.equal(result.inputTokens, 12);
  assert.equal(result.outputTokens, 8);
});

test("failed Hermes run throws its error", async () => {
  setupEnv();

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      return jsonResponse(200, {
        run_id: "hermes-run-2",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-2",
      status: "failed",
      error: { message: "bounded task failed" },
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });

  await assert.rejects(() => runtime.execute(request()), /bounded task failed/);
});

test("timeout throws a clear error", async () => {
  setupEnv();

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      return jsonResponse(200, {
        run_id: "hermes-run-timeout",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-timeout",
      status: "started",
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 8 });

  await assert.rejects(() => runtime.execute(request()), /timed out/);
});

test("malformed admission response without run_id is rejected", async () => {
  setupEnv();

  globalThis.fetch = async () => jsonResponse(200, { status: "started" });

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });

  await assert.rejects(() => runtime.execute(request()), /missing run_id/);
});

test("HTTP error during polling is not swallowed", async () => {
  setupEnv();

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      return jsonResponse(200, {
        run_id: "hermes-run-http",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(500, { message: "upstream failure" });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });

  await assert.rejects(() => runtime.execute(request()), /status 500/);
});

test("trailing slash in HERMES_API_URL is normalized", async () => {
  process.env.HERMES_API_URL = "https://hermes.example///";
  process.env.HERMES_API_KEY = "test-key";

  let createUrl = "";
  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      createUrl = String(input);
      return jsonResponse(200, {
        run_id: "hermes-run-3",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-3",
      status: "completed",
      output: {
        acknowledged: true,
        projectName: "MC-0001 — Mint Chip Website",
        summary: "ok",
      },
      model: { name: "deepseek-v4-pro" },
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  await runtime.execute(request());

  assert.equal(createUrl, "https://hermes.example/v1/runs");
});

test("getRun uses the normalized URL and encoded run id", async () => {
  let requestedUrl = "";

  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return jsonResponse(200, {
      run_id: "run/with spaces",
      status: "completed",
      output: {
        acknowledged: true,
        projectName: "MC-0001",
        summary: "ok",
      },
    });
  };

  const client = new HermesClient("https://hermes.example/", "test-key");
  await client.getRun("run/with spaces");

  assert.equal(requestedUrl, "https://hermes.example/v1/runs/run%2Fwith%20spaces");
});

test("Hermes createRun payload contains a valid user message", async () => {
  setupEnv();
  let payload: Record<string, unknown> | undefined;

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      payload = JSON.parse(String(init.body)) as Record<string, unknown>;
      return jsonResponse(200, {
        run_id: "hermes-run-message",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-message",
      status: "completed",
      output: {
        acknowledged: true,
        projectName: "MC-0001 — Mint Chip Website",
        summary: "ok",
      },
      model: { name: "deepseek-v4-pro" },
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  await runtime.execute(
    request({ input: "Reply with exactly: MINTCHIPOS_HERMES_OK" }),
  );

  assert.ok(payload);
  assert.deepEqual(payload.input, [
    { role: "user", content: "Reply with exactly: MINTCHIPOS_HERMES_OK" },
  ]);
  assert.equal(payload.model, "deepseek-v4-pro");
  assert.deepEqual(payload.allowed_skills, []);
  assert.deepEqual(payload.allowed_tools, []);
});

test("extractUserMessage reads a user message from a stored snapshot", () => {
  assert.equal(
    extractUserMessage({
      user_message: "Reply with exactly: MINTCHIPOS_HERMES_OK",
    }),
    "Reply with exactly: MINTCHIPOS_HERMES_OK",
  );
});

test("extractUserMessage supports a plain string snapshot", () => {
  assert.equal(extractUserMessage("  hello  "), "hello");
});

test("extractUserMessage rejects missing or empty input", () => {
  assert.throws(
    () => extractUserMessage(null),
    /No user message found in input snapshot/,
  );
  assert.throws(
    () => extractUserMessage({}),
    /No user message found in input snapshot/,
  );
  assert.throws(
    () => extractUserMessage({ user_message: "   " }),
    /No user message found in input snapshot/,
  );
});

test("runtime rejects an empty user message", async () => {
  setupEnv();

  globalThis.fetch = async () =>
    jsonResponse(200, { run_id: "hermes-run-empty", status: "started" });

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });

  await assert.rejects(
    () => runtime.execute(request({ input: "   " })),
    /missing a user message/,
  );
});
