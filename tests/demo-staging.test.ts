import test from "node:test";
import assert from "node:assert/strict";
import { buildDeploymentLineage, describeDeploymentLineage } from "../lib/demo-staging/lineage";
import {
  canTransition,
  supersedeDeployment,
  transitionDeployment,
} from "../lib/demo-staging/lifecycle";
import { generatePreviewSlug } from "../lib/demo-staging/naming";
import { MockDemoDeploymentProvider } from "../lib/demo-staging/provider";
import type { DemoDeploymentRecord } from "../lib/demo-staging/types";
import { validateDeploymentRecord } from "../lib/demo-staging/validate";

function deploymentRecord(
  overrides: Partial<DemoDeploymentRecord> = {},
): DemoDeploymentRecord {
  return {
    id: "deployment-1",
    projectId: "project-1",
    prospectId: "prospect-1",
    deploymentType: "PREVIEW",
    status: "PENDING",
    provider: "MOCK",
    providerDeploymentId: null,
    previewUrl: null,
    previewHostname: null,
    previewVisibility: "UNLISTED",
    sourceArtifactId: "artifact-1",
    sourceArtifactType: "DESIGN_DIRECTION_BRIEF",
    sourceCommit: "abc1234",
    buildId: "build-9",
    version: 1,
    metadata: {},
    isCurrent: false,
    failureReason: null,
    createdBy: "user-1",
    createdAt: "2026-09-13T00:00:00.000Z",
    updatedAt: "2026-09-13T00:00:00.000Z",
    deployedAt: null,
    failedAt: null,
    supersededAt: null,
    ...overrides,
  };
}

test("valid deployment record passes validation", () => {
  assert.equal(validateDeploymentRecord(deploymentRecord()).ok, true);
});

test("invalid deployment fields fail validation", () => {
  const result = validateDeploymentRecord(
    deploymentRecord({
      deploymentType: "STAGING" as never,
      status: "UNKNOWN" as never,
      previewUrl: "http://insecure.example",
      version: 0,
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors.deploymentType, "Unknown deployment type.");
  assert.equal(result.fieldErrors.status, "Unknown deployment status.");
  assert.equal(result.fieldErrors.previewUrl, "Preview URL must use HTTPS.");
  assert.equal(result.fieldErrors.version, "Version must be a whole number of 1 or more.");
});

test("preview slug generation is deterministic and provider-safe", () => {
  const first = generatePreviewSlug({
    businessName: "ABC Roofing",
    projectId: "project-1",
  });
  const second = generatePreviewSlug({
    businessName: "ABC Roofing",
    projectId: "project-1",
  });

  assert.deepEqual(first, second);
  assert.match(first.hostname, /^abc-roofing-[a-f0-9]{8}\.preview\.mintchipweb\.com$/);
  assert.equal(first.previewUrl, `https://${first.hostname}`);
});

test("preview naming avoids duplicate business-name collisions", () => {
  const first = generatePreviewSlug({
    businessName: "ABC Roofing",
    projectId: "project-1",
  });
  const second = generatePreviewSlug({
    businessName: "ABC Roofing",
    projectId: "project-2",
  });

  assert.notEqual(first.hostname, second.hostname);
});

test("preview naming preserves multiple versions", () => {
  const versionOne = generatePreviewSlug({
    businessName: "ABC Roofing",
    projectId: "project-1",
    version: 1,
  });
  const versionTwo = generatePreviewSlug({
    businessName: "ABC Roofing",
    projectId: "project-1",
    version: 2,
  });

  assert.notEqual(versionOne.hostname, versionTwo.hostname);
  assert.match(versionTwo.hostname, /-v2\.preview\.mintchipweb\.com$/);
});

test("preview naming normalizes invalid hostname characters", () => {
  const result = generatePreviewSlug({
    businessName: "  ABC! Roofing & Exteriors, LLC  ",
    projectId: "project-1",
  });

  assert.match(result.hostname, /^abc-roofing-and-exteriors-llc-/);
});

test("status transitions follow the allowed lifecycle", () => {
  assert.equal(canTransition("PENDING", "BUILDING"), true);
  assert.equal(canTransition("BUILDING", "READY"), true);
  assert.equal(canTransition("READY", "ARCHIVED"), true);
  assert.equal(canTransition("BUILDING", "PENDING"), false);
  assert.equal(canTransition("ARCHIVED", "READY"), false);
});

test("ready transition sets deployment timestamps and current flag", () => {
  const pending = deploymentRecord();
  const building = transitionDeployment(pending, "BUILDING", {
    now: "2026-09-13T01:00:00.000Z",
  });
  const ready = transitionDeployment(building, "READY", {
    now: "2026-09-13T02:00:00.000Z",
  });

  assert.equal(ready.status, "READY");
  assert.equal(ready.isCurrent, true);
  assert.equal(ready.deployedAt, "2026-09-13T02:00:00.000Z");
  assert.equal(ready.failureReason, null);
});

test("invalid transition throws a clear error", () => {
  assert.throws(
    () => transitionDeployment(deploymentRecord(), "READY"),
    /Invalid deployment transition/,
  );
});

test("failed transition records failure information", () => {
  const failed = transitionDeployment(
    transitionDeployment(deploymentRecord(), "BUILDING"),
    "FAILED",
    {
      failureReason: "Build exited with code 1.",
      now: "2026-09-13T03:00:00.000Z",
    },
  );

  assert.equal(failed.status, "FAILED");
  assert.equal(failed.failedAt, "2026-09-13T03:00:00.000Z");
  assert.equal(failed.failureReason, "Build exited with code 1.");
});

test("version lineage captures the full build chain", () => {
  const record = deploymentRecord({
    providerDeploymentId: "mock_abc-roofing",
    previewUrl: "https://abc-roofing-abc12345.preview.mintchipweb.com",
  });
  const lineage = buildDeploymentLineage(record);

  assert.equal(lineage.projectId, "project-1");
  assert.equal(lineage.prospectId, "prospect-1");
  assert.equal(lineage.sourceArtifactId, "artifact-1");
  assert.equal(lineage.sourceCommit, "abc1234");
  assert.equal(lineage.buildId, "build-9");
  assert.equal(lineage.providerDeploymentId, "mock_abc-roofing");

  const description = describeDeploymentLineage(record);
  assert.match(description, /artifact:artifact-1/);
  assert.match(description, /commit:abc1234/);
  assert.match(description, /build:build-9/);
  assert.match(description, /version:1/);
});

test("mock provider creates and reads a deterministic preview", async () => {
  const provider = new MockDemoDeploymentProvider();
  const preview = generatePreviewSlug({
    businessName: "ABC Roofing",
    projectId: "project-1",
  });
  const created = await provider.createPreview({
    projectId: "project-1",
    prospectId: "prospect-1",
    deploymentType: "PREVIEW",
    previewSlug: preview,
    previewVisibility: "UNLISTED",
    sourceCommit: "abc1234",
    buildId: "build-9",
    metadata: {},
  });

  assert.equal(created.status, "READY");
  assert.equal(created.previewUrl, preview.previewUrl);

  const status = await provider.getDeploymentStatus(
    created.providerDeploymentId,
  );
  assert.equal(status.status, "READY");

  const logs = await provider.getDeploymentLogs(
    created.providerDeploymentId,
  );
  assert.ok(logs.logs.some((log) => log.includes("Preview ready")));
});

test("mock provider failure is surfaced without hiding the provider boundary", async () => {
  const provider = new MockDemoDeploymentProvider({ failOnCreate: true });
  const preview = generatePreviewSlug({
    businessName: "ABC Roofing",
    projectId: "project-1",
  });

  await assert.rejects(
    provider.createPreview({
      projectId: "project-1",
      prospectId: null,
      deploymentType: "PREVIEW",
      previewSlug: preview,
      previewVisibility: "UNLISTED",
      sourceCommit: null,
      buildId: null,
      metadata: {},
    }),
    /Mock deployment provider failed/,
  );
});

test("superseding preserves the old preview and clears its current flag", () => {
  const current = transitionDeployment(
    transitionDeployment(deploymentRecord(), "BUILDING"),
    "READY",
  );
  const superseded = supersedeDeployment(current, "2026-09-13T04:00:00.000Z");

  assert.equal(superseded.status, "READY");
  assert.equal(superseded.isCurrent, false);
  assert.equal(superseded.supersededAt, "2026-09-13T04:00:00.000Z");
});

