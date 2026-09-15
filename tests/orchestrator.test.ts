import test from "node:test";
import assert from "node:assert/strict";
import { detectIntent, intentTitle } from "../lib/orchestrator/intents";
import { resolveProductionReadiness } from "../lib/orchestrator/readiness";
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

test("production readiness resolves blocking defects and demo limitations", () => {
  const result = resolveProductionReadiness({
    id: "run-1",
    project_id: "project-1",
    website_url: "https://example.com",
    business_name: "Example Business",
    status: "COMPLETED",
    current_stage: "PREVIEW_DEPLOYMENT",
    progress: 100,
    stages: [
      { stage: "FUNCTIONAL_QA", status: "COMPLETED", output: { passed: true } },
      {
        stage: "VISUAL_QA",
        status: "COMPLETED",
        output: {
          status: "FAILED",
          blockingDefects: ["Slider is not keyboard-operable"],
          demoLimitations: ["MISSING_REAL_PHONE", "FORM_NOT_CONNECTED"],
        },
      },
    ],
    artifacts: [],
    preview_url: "https://preview.example.com",
    provider_deployment_id: "dpl_test",
    failure_reason: null,
    created_by: null,
    created_at: null,
    updated_at: null,
  });

  assert.equal(result.productionReady, false);
  assert.equal(result.previewReady, true);
  assert.equal(result.visualQaStatus, "FAILED");
  assert.deepEqual(result.blockingDefects, [
    "Slider is not keyboard-operable",
  ]);
  assert.deepEqual(result.demoLimitations, [
    "MISSING_REAL_PHONE",
    "FORM_NOT_CONNECTED",
  ]);
});

test("missing generic exception row does not imply production readiness", () => {
  const result = resolveProductionReadiness({
    id: "run-2",
    project_id: "project-1",
    website_url: "https://example.com",
    business_name: "Example Business",
    status: "COMPLETED",
    current_stage: "PREVIEW_DEPLOYMENT",
    progress: 100,
    stages: [
      {
        stage: "VISUAL_QA",
        status: "COMPLETED",
        output: {
          status: "PASSED_WITH_DEMO_LIMITATIONS",
          blockingDefects: [],
          demoLimitations: ["PLACEHOLDER_REVIEWS"],
        },
      },
    ],
    artifacts: [],
    preview_url: "https://preview.example.com",
    provider_deployment_id: "dpl_test",
    failure_reason: null,
    created_by: null,
    created_at: null,
    updated_at: null,
  });

  assert.equal(result.productionReady, false);
  assert.equal(result.visualQaStatus, "PASSED_WITH_DEMO_LIMITATIONS");
  assert.equal(result.blockingDefects.length, 0);
});

test("current Mint Chip canonical fixture resolves as failed with demo limitations", () => {
  const result = resolveProductionReadiness({
    id: "9aa5d0d7-6d8e-4a87-915c-fcbcf6967558",
    project_id: "project-1",
    website_url: "https://mintchipweb.com",
    business_name: "Mint Chip Website",
    status: "COMPLETED",
    current_stage: "PREVIEW_DEPLOYMENT",
    progress: 100,
    stages: [
      {
        stage: "VISUAL_QA",
        status: "COMPLETED",
        output: {
          status: "FAILED",
          blockingDefects: [
            "Before/after comparison control is not keyboard-operable",
          ],
          demoLimitations: [
            "MISSING_REAL_PHONE",
            "FORM_NOT_CONNECTED",
            "PLACEHOLDER_REVIEWS",
            "PLACEHOLDER_PORTFOLIO",
          ],
        },
      },
    ],
    artifacts: [],
    preview_url: "https://mint-chip-v2fe-bizk1azio-mint-chip.vercel.app",
    provider_deployment_id: "dpl_DZdLeMFmtJa2iQcgMPkRSFw6HoBH",
    failure_reason: null,
    created_by: null,
    created_at: null,
    updated_at: null,
  });

  assert.equal(result.visualQaStatus, "FAILED");
  assert.equal(result.blockingDefects.length, 1);
  assert.equal(result.demoLimitations.length, 4);
});
