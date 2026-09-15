import test from "node:test";
import assert from "node:assert/strict";
import { detectIntent, intentTitle } from "../lib/orchestrator/intents";
import { mapFactoryStatusToTaskStatus } from "../lib/orchestrator/status";
import { normalizeVisualQaReport, visualQaGate } from "../lib/website-factory/qa";

test("detects BUILD_DEMO_FROM_URL from an explicit URL demo request", () => {
  const result = detectIntent(
    "Build a demo for https://example.com",
  );

  assert.equal(result.intent, "BUILD_DEMO_FROM_URL");
  assert.equal(result.url, "https://example.com");
  assert.ok(result.confidence >= 0.9);
});

test("detects SHOW_PREVIEW from a latest demo request", () => {
  const result = detectIntent("Show me the latest Mint Chip demo.");
  assert.equal(result.intent, "SHOW_PREVIEW");
});

test("detects EXPLAIN_EXCEPTION from production-readiness question", () => {
  const result = detectIntent(
    "Why isn't the Mint Chip demo fully production-ready?",
  );
  assert.equal(result.intent, "EXPLAIN_EXCEPTION");
});

test("maps factory run statuses to task statuses", () => {
  assert.equal(mapFactoryStatusToTaskStatus("NOT_STARTED"), "QUEUED");
  assert.equal(mapFactoryStatusToTaskStatus("RUNNING"), "RUNNING");
  assert.equal(mapFactoryStatusToTaskStatus("COMPLETED"), "SUCCEEDED");
  assert.equal(mapFactoryStatusToTaskStatus("FAILED"), "FAILED");
});

test("normalizes old visual QA reports and distinguishes demo limitations", () => {
  const report = normalizeVisualQaReport({
    passed: true,
    checks: [{ name: "layout", passed: true, detail: "ok" }],
    defects: [],
    demoLimitations: ["MISSING_REAL_PHONE", "FORM_NOT_CONNECTED"],
  });

  assert.equal(report.status, "PASSED_WITH_DEMO_LIMITATIONS");
  assert.equal(report.blockingDefects.length, 0);
  assert.deepEqual(report.demoLimitations, [
    "MISSING_REAL_PHONE",
    "FORM_NOT_CONNECTED",
  ]);
  assert.equal(visualQaGate(report).allowed, true);
  assert.equal(visualQaGate(report).requiresDemoLabel, true);
});

test("true visual defects remain failures", () => {
  const report = normalizeVisualQaReport({
    passed: false,
    checks: [{ name: "keyboard", passed: false, detail: "not operable" }],
    defects: ["not operable"],
  });

  assert.equal(report.status, "FAILED");
  assert.equal(visualQaGate(report).allowed, false);
});

test("intent titles are compact and operator-facing", () => {
  assert.equal(
    intentTitle("BUILD_DEMO_FROM_URL", "https://example.com"),
    "Demo for example.com",
  );
  assert.equal(intentTitle("SHOW_PREVIEW", null), "Show latest preview");
});

