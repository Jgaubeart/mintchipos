import test from "node:test";
import assert from "node:assert/strict";
import { ensureBuildableHtml } from "../lib/website-factory/builder";
import { frontendBuildToManifest, validateBuildManifest } from "../lib/website-factory/build-manifest";
import { buildFrontendBuildSpec } from "../lib/website-factory/build-spec";
import { classifyIndustry } from "../lib/website-factory/classify";
import {
  buildPollPlan,
  canRecoverCompletedRemoteRun,
  shouldPollRemoteRun,
} from "../lib/website-factory/remote-run";
import type {
  AssetPlan,
  BusinessResearch,
  CreativeDirection,
  DesignBrief,
  UxContentStrategy,
} from "../lib/website-factory/types";

function research(): BusinessResearch {
  return {
    businessName: "Mint Chip",
    domain: "mintchipweb.com",
    websiteUrl: "https://mintchipweb.com",
    location: "Cape Coral, FL",
    city: "Cape Coral",
    state: "FL",
    description: "Modern websites for local businesses.",
    services: ["Managed website service"],
    products: [],
    serviceAreas: [],
    phone: null,
    publicEmail: null,
    contactUrl: null,
    socialUrls: [],
    testimonialsPresent: [],
    reviewsPresent: [],
    licensesCertifications: [],
    yearsInBusiness: null,
    guarantees: [],
    trustBadges: [],
    portfolioPresent: [],
    currentPages: ["/"],
    ctaPatterns: [],
    navigation: [],
    formsPresent: true,
    images: [],
    metadata: {},
    technicalQuality: [],
    headline: "Fresh websites for local businesses.",
    valueProposition: "Bold, modern websites for local businesses.",
    notableCopy: [],
    provenance: [],
    confidence: 1,
  };
}

test("resolved frontend build spec does not include the full playbook", () => {
  const brief = {
    project: { businessName: "Mint Chip" },
    siteFormat: { format: "ONE_PAGE" },
    demoConversionUx: { primaryCtaConcept: "Get a free website" },
    colorDirection: { requiredColors: ["#0F1110", "#7EF5C6"] },
  } as unknown as DesignBrief;
  const strategy = {
    sectionSequence: ["Hero", "Services", "Contact"],
    headlineStrategy: "Fresh websites for local businesses.",
  } as UxContentStrategy;
  const creative = {
    centralVisualConcept: "Sculptural mint-chip scoop.",
    sectionOrder: ["Hero", "Services", "Contact"],
    colorApplication: "Deep black with mint action color.",
    typographySystem: "Clash Display + General Sans.",
    motionDirection: "Subtle",
  } as CreativeDirection;
  const assets = {} as AssetPlan;

  const spec = buildFrontendBuildSpec({
    brief,
    research: research(),
    strategy,
    creative,
    assets,
  });

  assert.equal(spec.siteFormat, "ONE_PAGE");
  assert.deepEqual(spec.sections, ["Hero", "Services", "Contact"]);
  assert.ok(!JSON.stringify(spec).includes("industryOverview"));
});

test("compact build manifest is valid and omits full html", () => {
  const manifest = frontendBuildToManifest({
    siteFormat: "ONE_PAGE",
    html: "<html>very long html</html>",
    sourceFiles: ["index.html"],
    buildId: "build-123",
    buildResult: "OK",
  });

  assert.equal(validateBuildManifest(manifest).ok, true);
  assert.equal(manifest.buildStatus, "PASSED");
  assert.ok(!("html" in manifest));
});

test("ensureBuildableHtml adds missing viewport and contact CTA", () => {
  const repaired = ensureBuildableHtml({
    html: "<!doctype html><html><head><title>Mint Chip</title></head><body><main><h1>Hello</h1></main></body></html>",
    businessName: "Mint Chip",
    cta: "Get a free website",
  });

  assert.match(repaired, /name="viewport"/);
  assert.match(repaired, /id="contact"/);
  assert.match(repaired, /class="cta"/);
});

test("classification can use known project industry to avoid confidence zero", () => {
  const classification = classifyIndustry(
    research(),
    "AI Website Design",
  );

  assert.equal(classification.primaryIndustry, "AI Website Design");
  assert.equal(classification.confidence, 1);
  assert.equal(classification.exception, null);
});

test("remote run recovery and polling are bounded and avoid duplicate launches", () => {
  assert.equal(canRecoverCompletedRemoteRun("completed"), true);
  assert.equal(canRecoverCompletedRemoteRun("running"), false);
  assert.equal(shouldPollRemoteRun("running"), true);
  assert.equal(shouldPollRemoteRun("completed"), false);

  const startedAt = Date.now() - 1000;
  const plan = buildPollPlan({
    startedAtMs: startedAt,
    overallDeadlineMs: 5000,
    pollIntervalMs: 1000,
  });
  assert.ok(plan.remainingMs <= 4000);
  assert.ok(plan.nextPollMs >= 0);
});

