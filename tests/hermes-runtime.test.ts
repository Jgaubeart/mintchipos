import test from "node:test";
import assert from "node:assert/strict";
import { HermesClient } from "../lib/execution/hermes/client";
import {
  DEFAULT_POLL_TIMEOUT_MS,
  HermesPollTimeoutError,
  HermesRuntime,
} from "../lib/execution/hermes/runtime";
import { toExecutionFailure } from "../lib/execution/failure";
import { extractUserMessage } from "../lib/execution/input";
import { resolveExecutionTimeoutMs } from "../lib/execution/research";
import { validateAgentOutput } from "../lib/execution/validation";
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

function completedRunFetch(output: unknown): typeof fetch {
  return async (input, init) => {
    if (init?.method === "POST") {
      return jsonResponse(200, {
        run_id: "hermes-run-generic",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-generic",
      status: "completed",
      output,
      model: { name: "deepseek-v4-pro" },
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    });
  };
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

  const error = await runtime
    .execute(request())
    .then(
      () => {
        throw new Error("Expected the run to time out.");
      },
      (caught: unknown) => caught,
    );

  assert.ok(error instanceof HermesPollTimeoutError);
  assert.match(error.message, /hermes-run-timeout/);
  assert.match(error.message, /timed out/);
  assert.match(error.message, /may still be active/);
  assert.equal(error.timeoutMs, 8);
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

test("string Hermes output succeeds", async () => {
  setupEnv();
  globalThis.fetch = completedRunFetch("MINTCHIPOS_HERMES_OK");

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  const result = await runtime.execute(request());

  assert.equal(result.output, "MINTCHIPOS_HERMES_OK");
});

test("object Hermes output succeeds", async () => {
  setupEnv();
  globalThis.fetch = completedRunFetch({ result: "ok" });

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  const result = await runtime.execute(request());

  assert.deepEqual(result.output, { result: "ok" });
});

test("array Hermes output succeeds", async () => {
  setupEnv();
  globalThis.fetch = completedRunFetch([1, 2, 3]);

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  const result = await runtime.execute(request());

  assert.deepEqual(result.output, [1, 2, 3]);
});

test("null Hermes output is rejected", async () => {
  setupEnv();
  globalThis.fetch = completedRunFetch(null);

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });

  await assert.rejects(
    () => runtime.execute(request()),
    /completed without an output/,
  );
});

test("validateAgentOutput accepts generic non-null values", () => {
  assert.equal(validateAgentOutput("ok").ok, true);
  assert.equal(validateAgentOutput({ a: 1 }).ok, true);
  assert.equal(validateAgentOutput([1, 2]).ok, true);
  assert.equal(validateAgentOutput(0).ok, true);
  assert.equal(validateAgentOutput(false).ok, true);
});

test("validateAgentOutput rejects null and undefined", () => {
  assert.equal(validateAgentOutput(null).ok, false);
  assert.equal(validateAgentOutput(undefined).ok, false);
});

test("output_schema is omitted when no schema is configured", async () => {
  setupEnv();
  let payload: Record<string, unknown> | undefined;

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      payload = JSON.parse(String(init.body)) as Record<string, unknown>;
      return jsonResponse(200, {
        run_id: "hermes-run-no-schema",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-no-schema",
      status: "completed",
      output: "MINTCHIPOS_HERMES_OK",
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  await runtime.execute(request());

  assert.ok(payload);
  assert.equal("output_schema" in payload, false);
});

test("output_schema is sent when explicitly configured", async () => {
  setupEnv();
  let payload: Record<string, unknown> | undefined;

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      payload = JSON.parse(String(init.body)) as Record<string, unknown>;
      return jsonResponse(200, {
        run_id: "hermes-run-schema",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-schema",
      status: "completed",
      output: { result: "ok" },
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  await runtime.execute(request({ outputSchema: { type: "object" } }));

  assert.ok(payload);
  assert.deepEqual(payload.output_schema, { type: "object" });
});

test("project context is included in the Hermes input message", async () => {
  setupEnv();
  let payload: Record<string, unknown> | undefined;

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      payload = JSON.parse(String(init.body)) as Record<string, unknown>;
      return jsonResponse(200, {
        run_id: "hermes-run-context",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-context",
      status: "completed",
      output: "ok",
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  await runtime.execute(
    request({
      input: "Analyze this project.",
      projectContext: "Project context:\n- Name: Mint Chip Website",
    }),
  );

  assert.ok(payload);
  const messages = payload.input as { role: string; content: string }[];

  assert.equal(messages.length, 1);
  assert.match(messages[0].content, /Mint Chip Website/);
  assert.match(messages[0].content, /User request:\nAnalyze this project/);
});

test("generic default Hermes timeout is 180000 ms", () => {
  assert.equal(DEFAULT_POLL_TIMEOUT_MS, 180_000);
});

test("Research Strategist timeout resolves to 300000 ms", () => {
  assert.equal(resolveExecutionTimeoutMs("RESEARCH_STRATEGIST"), 300_000);
  assert.equal(resolveExecutionTimeoutMs("CREATIVE_DIRECTOR"), undefined);
});

test("poll timeout maps to HERMES_POLL_TIMEOUT with the runtime run id", () => {
  const failure = toExecutionFailure(
    new HermesPollTimeoutError("hermes-run-abc", 180_000),
  );

  assert.equal(failure.errorCode, "HERMES_POLL_TIMEOUT");
  assert.equal(failure.runtimeRunId, "hermes-run-abc");
  assert.match(failure.errorMessage, /hermes-run-abc/);
});

test("generic execution failure keeps HERMES_EXECUTION_FAILED", () => {
  const failure = toExecutionFailure(new Error("something broke"));

  assert.equal(failure.errorCode, "HERMES_EXECUTION_FAILED");
  assert.equal(failure.runtimeRunId, undefined);
});

test("runtime reports the admitted run id as early as practical", async () => {
  setupEnv();
  let reportedRunId: string | undefined;

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      return jsonResponse(200, {
        run_id: "hermes-run-admit",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-admit",
      status: "completed",
      output: "ok",
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  await runtime.execute(
    request({
      onRuntimeRunId: (runtimeRunId) => {
        reportedRunId = runtimeRunId;
      },
    }),
  );

  assert.equal(reportedRunId, "hermes-run-admit");
});

test("request executionTimeoutMs overrides the runtime default", async () => {
  setupEnv();

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      return jsonResponse(200, {
        run_id: "hermes-run-override",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-override",
      status: "started",
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  const error = await runtime
    .execute(request({ executionTimeoutMs: 5 }))
    .then(
      () => {
        throw new Error("Expected the run to time out.");
      },
      (caught: unknown) => caught,
    );

  assert.ok(error instanceof HermesPollTimeoutError);
  assert.equal(error.timeoutMs, 5);
});

test("cancelled and interrupted Hermes runs still throw", async () => {
  setupEnv();

  for (const status of ["cancelled", "interrupted"]) {
    globalThis.fetch = async (input, init) => {
      if (init?.method === "POST") {
        return jsonResponse(200, {
          run_id: `hermes-run-${status}`,
          status: "started",
          replayed: false,
        });
      }

      return jsonResponse(200, {
        run_id: `hermes-run-${status}`,
        status,
      });
    };

    const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });

    await assert.rejects(
      () => runtime.execute(request()),
      new RegExp(status),
    );
  }
});

test("schema-constrained instructions include the output schema in the prompt", async () => {
  setupEnv();
  let payload: Record<string, unknown> | undefined;

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      payload = JSON.parse(String(init.body)) as Record<string, unknown>;
      return jsonResponse(200, {
        run_id: "hermes-run-schema-prompt",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-schema-prompt",
      status: "completed",
      output: { executive_summary: "ok" },
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  await runtime.execute(
    request({
      outputSchema: {
        type: "object",
        required: ["executive_summary"],
        properties: {
          executive_summary: { type: "string" },
        },
      },
    }),
  );

  assert.ok(payload);
  const instructions = String(payload.instructions);

  assert.match(instructions, /OUTPUT REQUIREMENTS/);
  assert.match(instructions, /executive_summary/);
  assert.match(instructions, /Return ONLY valid JSON/);
});

test("generic no-schema requests keep plain instructions", async () => {
  setupEnv();
  let payload: Record<string, unknown> | undefined;

  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      payload = JSON.parse(String(init.body)) as Record<string, unknown>;
      return jsonResponse(200, {
        run_id: "hermes-run-plain",
        status: "started",
        replayed: false,
      });
    }

    return jsonResponse(200, {
      run_id: "hermes-run-plain",
      status: "completed",
      output: "ok",
    });
  };

  const runtime = new HermesRuntime({ pollIntervalMs: 1, timeoutMs: 1000 });
  await runtime.execute(request());

  assert.ok(payload);
  assert.equal(payload.instructions, "Bounded acknowledgement instructions.");
  assert.doesNotMatch(String(payload.instructions), /OUTPUT REQUIREMENTS/);
});
