import test from "node:test";
import assert from "node:assert/strict";
import type {
  DemoDeploymentCreateResult,
  DemoDeploymentProvider,
  DemoDeploymentStatusResult,
} from "../lib/demo-staging/types";
import type { DesignBrief } from "../lib/design-brief/types";
import { validateDesignBrief } from "../lib/design-brief/validate";
import { classifyIndustry } from "../lib/website-factory/classify";
import { runWebsiteFactoryPipeline } from "../lib/website-factory/pipeline";
import type {
  BusinessResearch,
  FrontendBuilder,
  FrontendBuildResult,
} from "../lib/website-factory/types";

const input = {
  projectId: "project-1",
  websiteUrl: "https://mintchipweb.com",
  businessName: "Mint Chip Website",
};

function research(): BusinessResearch {
  return {
    businessName: "Mint Chip Website",
    domain: "mintchipweb.com",
    websiteUrl: "https://mintchipweb.com",
    location: "Cape Coral, FL",
    city: "Cape Coral",
    state: "FL",
    description: "AI-native managed website service for small local businesses.",
    services: ["Managed website service", "Website design"],
    products: [],
    serviceAreas: ["Cape Coral", "Fort Myers"],
    phone: "239-555-0142",
    publicEmail: "hello@mintchipweb.com",
    contactUrl: "https://mintchipweb.com/contact",
    socialUrls: [],
    testimonialsPresent: [],
    reviewsPresent: [],
    licensesCertifications: [],
    yearsInBusiness: null,
    guarantees: [],
    trustBadges: ["Locally operated"],
    portfolioPresent: [],
    currentPages: ["/", "/about", "/services", "/contact"],
    ctaPatterns: ["Get a quote", "Contact us"],
    navigation: ["Home", "Services", "About", "Contact"],
    formsPresent: true,
    images: [],
    metadata: {},
    technicalQuality: [],
    headline: "Mint Chip Website",
    valueProposition: "Managed websites for small local businesses.",
    notableCopy: [],
    provenance: [{ url: "fixture://research", note: "Fixture research." }],
    confidence: 0.8,
  };
}

class ResearchProvider {
  async research() {
    return research();
  }
}

class FailingDeploymentProvider implements DemoDeploymentProvider {
  name = "FAILING";
  isConfigured = true;
  async createPreview(): Promise<DemoDeploymentCreateResult> {
    throw new Error("Live preview verification is not available.");
  }
  async getDeploymentStatus(): Promise<DemoDeploymentStatusResult> {
    throw new Error("Not implemented in fixture.");
  }
  async getDeploymentLogs() {
    return { providerDeploymentId: "x", logs: [] };
  }
  async archivePreview() {}
}

class RepairingBuilder implements FrontendBuilder {
  private attempts = 0;

  async build(): Promise<FrontendBuildResult> {
    this.attempts += 1;
    if (this.attempts === 1) {
      return {
        siteFormat: "ONE_PAGE",
        html: "<html><head><title>Broken</title></head><body>missing contact</body></html>",
        sourceFiles: ["index.html"],
        buildId: "bad-build",
        buildResult: "OK",
      };
    }

    return {
      siteFormat: "ONE_PAGE",
      html: "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width\"><title>Fixed</title></head><body><main><h1>Fixed</h1><section id=\"contact\"><a class=\"cta\">Contact</a></section><section>About</section><section>Services</section><p>Demo preview — not the business&apos;s live website.</p></main></body></html>",
      sourceFiles: ["index.html"],
      buildId: "fixed-build",
      buildResult: "OK",
    };
  }
}

test("website factory pipeline completes all stages with fixtures", async () => {
  const run = await runWebsiteFactoryPipeline(input, {
    researchProvider: new ResearchProvider(),
  });

  assert.equal(run.status, "COMPLETED");
  assert.equal(run.stages.length, 12);
  assert.equal(
    run.stages.filter((stage) => stage.status === "COMPLETED").length,
    12,
  );
  assert.ok(run.previewUrl?.startsWith("https://"));
  assert.ok(run.buildId);
});

test("industry classification maps business signals to a playbook industry", () => {
  const classification = classifyIndustry(research());
  assert.equal(classification.primaryIndustry, "AI Website Design");
  assert.ok(classification.confidence > 0.6);
  assert.ok(classification.matchedKeywords.length > 0);
});

test("automatic design brief is valid and uses agent source", async () => {
  const run = await runWebsiteFactoryPipeline(input, {
    researchProvider: new ResearchProvider(),
  });
  const briefStage = run.stages.find(
    (stage) => stage.stage === "DESIGN_BRIEF",
  );
  assert.ok(briefStage);

  const brief = (briefStage.output as { brief: DesignBrief }).brief;
  assert.equal(validateDesignBrief(brief).ok, true);
  assert.equal(brief.source, "AGENT");
});

test("bounded repair loop fixes a failing build", async () => {
  const run = await runWebsiteFactoryPipeline(input, {
    researchProvider: new ResearchProvider(),
    frontendBuilder: new RepairingBuilder(),
  });

  assert.equal(run.status, "COMPLETED");
  const buildStage = run.stages.find(
    (stage) => stage.stage === "FRONTEND_BUILD",
  );
  const output = buildStage?.output as FrontendBuildResult | undefined;
  assert.equal(buildStage?.defectCount, 1);
  assert.equal(output?.buildId, "fixed-build");
});

test("failed preview deployment marks the run ready for live verification", async () => {
  const run = await runWebsiteFactoryPipeline(input, {
    researchProvider: new ResearchProvider(),
    deploymentProvider: new FailingDeploymentProvider(),
  });

  assert.equal(run.status, "READY_FOR_LIVE_VERIFICATION");
  assert.equal(run.previewUrl, null);
  assert.match(run.failureReason ?? "", /Live preview verification/);
});
