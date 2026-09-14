import test from "node:test";
import assert from "node:assert/strict";
import { PublicWebsiteContactProvider } from "../lib/prospecting/contact";
import { dedupeCandidates } from "../lib/prospecting/dedupe";
import {
  normalizeBusinessName,
  normalizeCandidate,
  normalizeDomain,
  normalizePhone,
} from "../lib/prospecting/normalize";
import { executeProspectScan } from "../lib/prospecting/orchestrator";
import { FixtureDiscoveryProvider } from "../lib/prospecting/providers";
import { scoreProspect } from "../lib/prospecting/scoring";
import type {
  NormalizedCandidate,
  ProspectCandidate,
} from "../lib/prospecting/types";
import { inspectWebsite } from "../lib/prospecting/website";

function candidate(
  overrides: Partial<ProspectCandidate> = {},
): ProspectCandidate {
  return {
    businessName: "Acme Roofing",
    websiteUrl: "https://www.acme-roofing.com/",
    industry: "roofing",
    city: "Cape Coral",
    state: "FL",
    country: "US",
    phone: "239-555-0142",
    source: "FIXTURE",
    appearsActive: true,
    localBusiness: true,
    locationCount: 1,
    ...overrides,
  };
}

function normalizedCandidate(
  overrides: Partial<ProspectCandidate> = {},
): NormalizedCandidate {
  const normalized = normalizeCandidate(candidate(overrides));
  assert.ok(normalized);
  return normalized;
}

const healthyHtml = `<!doctype html>
<html>
<head>
  <title>Acme Roofing</title>
  <meta name="description" content="Cape Coral roofing company" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <a href="/about">About</a>
  <a href="/services">Services</a>
  <a href="/contact">Contact</a>
  <a href="tel:2395550142">Call us</a>
  <a href="mailto:hello@acme-roofing.com">Email us</a>
  <a href="https://facebook.com/acme">Facebook</a>
  <form><input type="text" /></form>
  <img src="/roof.jpg" alt="Roof" />
  <img src="/crew.jpg" alt="Crew" />
</body>
</html>`;

function htmlResponse(
  html: string,
  status = 200,
): Response {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

test("candidate normalization produces a stable domain and fingerprint", () => {
  const normalized = normalizedCandidate();

  assert.equal(normalized.domain, "acme-roofing.com");
  assert.equal(normalized.businessName, "Acme Roofing");
  assert.equal(normalized.phone, "2395550142");
  assert.ok(normalized.duplicateFingerprint.includes("domain:acme-roofing.com"));
});

test("normalization helpers are deterministic", () => {
  assert.equal(normalizeDomain("HTTPS://WWW.Example.COM/path?x=1"), "example.com");
  assert.equal(normalizeBusinessName("  Acme   Roofing, LLC!  "), "acme roofing llc");
  assert.equal(normalizePhone("+1 (239) 555-0142"), "2395550142");
});

test("duplicate detection collapses candidates with the same normalized domain", () => {
  const first = normalizedCandidate();
  const second = normalizedCandidate({
    businessName: "Acme Roofing Services",
    websiteUrl: "https://acme-roofing.com",
  });

  assert.equal(dedupeCandidates([first, second]).length, 1);
});

test("duplicate detection collapses candidates with the same phone", () => {
  const first = normalizedCandidate({ websiteUrl: null });
  const second = normalizedCandidate({
    businessName: "Another Roofing Co",
    websiteUrl: null,
    phone: "2395550142",
  });

  assert.equal(dedupeCandidates([first, second]).length, 1);
});

test("no-website prospects are scored as high website opportunity", async () => {
  const provider = new FixtureDiscoveryProvider();
  const result = await executeProspectScan(
    {
      location: "Cape Coral, FL",
      industries: ["roofing"],
      limit: 3,
    },
    { discoveryProvider: provider },
  );

  assert.equal(result.prospects.length, 3);
  assert.equal(result.counters.discoveredCount, 3);
  assert.equal(result.counters.qualifiedCount, 3);
  assert.equal(result.prospects[0]?.websitePresent, false);
  assert.equal(result.prospects[0]?.websiteOpportunityScore, 100);
});

test("unreachable websites are reported as unreachable", async () => {
  const fetchImpl = async () => htmlResponse("", 404);
  const result = await inspectWebsite("https://acme-roofing.com", {
    fetchImpl,
  });

  assert.equal(result.websitePresent, true);
  assert.equal(result.websiteReachable, false);
  assert.equal(result.visualAuditStatus, "FAILED");
});

test("website signal extraction is deterministic and inexpensive", async () => {
  const fetchImpl = async () => htmlResponse(healthyHtml);
  const result = await inspectWebsite("https://www.acme-roofing.com/", {
    fetchImpl,
    maxPages: 2,
    maxRequests: 3,
  });

  assert.equal(result.title, "Acme Roofing");
  assert.equal(result.metaDescriptionPresent, true);
  assert.equal(result.viewportPresent, true);
  assert.equal(result.mobileResponsive, true);
  assert.deepEqual(result.phoneLinks, ["2395550142"]);
  assert.deepEqual(result.emailLinks, ["hello@acme-roofing.com"]);
  assert.equal(result.contactPageUrl, "https://www.acme-roofing.com/contact");
  assert.equal(result.formPresent, true);
  assert.equal(result.imageCount, 2);
  assert.ok(result.socialLinks.some((url) => url.includes("facebook.com")));
  assert.ok(result.navigationLinkCount >= 2);
});

test("bounded crawl respects page and request limits", async () => {
  const requested: string[] = [];
  const fetchImpl = async (input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);

    return htmlResponse(
      `<html><head><title>Page</title></head><body>
        <a href="/one">One</a>
        <a href="/two">Two</a>
        <a href="/three">Three</a>
        <a href="/four">Four</a>
      </body></html>`,
      200,
    );
  };

  const result = await inspectWebsite("https://acme-roofing.com", {
    fetchImpl,
    maxPages: 2,
    maxRequests: 3,
  });

  assert.ok(requested.length <= 3);
  assert.ok(result.pageCountEstimate <= 2);
});

test("public contact extraction only accepts existing email addresses", () => {
  const normalized = normalizedCandidate({ publicEmail: null });
  const provider = new PublicWebsiteContactProvider();
  const noEmail = {
    websitePresent: false,
    websiteReachable: false,
    httpStatus: null,
    httpsPresent: false,
    title: null,
    metaDescriptionPresent: false,
    viewportPresent: false,
    mobileResponsive: null,
    navigationLinkCount: 0,
    phoneLinks: [],
    emailLinks: [],
    contactLinks: [],
    contactPageUrl: null,
    formPresent: false,
    portfolioPresent: false,
    testimonialsPresent: false,
    imageCount: 0,
    socialLinks: [],
    pageCountEstimate: 0,
    brokenLinks: [],
    lastModifiedAt: null,
    visualAuditStatus: "NOT_INSPECTED" as const,
    auditNotes: [],
    auditTimestamp: null,
  };

  const result = provider.discover(normalized, noEmail);
  assert.equal(result.emailFound, false);
  assert.equal(result.email, null);
});

test("no guessed email is produced by the contact provider", () => {
  const normalized = normalizedCandidate({
    publicEmail: "not-an-email",
  });
  const provider = new PublicWebsiteContactProvider();
  const result = provider.discover(normalized, {
    websitePresent: true,
    websiteReachable: true,
    httpStatus: 200,
    httpsPresent: true,
    title: null,
    metaDescriptionPresent: false,
    viewportPresent: false,
    mobileResponsive: false,
    navigationLinkCount: 0,
    phoneLinks: [],
    emailLinks: ["hello@acme-roofing.com"],
    contactLinks: [],
    contactPageUrl: null,
    formPresent: false,
    portfolioPresent: false,
    testimonialsPresent: false,
    imageCount: 0,
    socialLinks: [],
    pageCountEstimate: 1,
    brokenLinks: [],
    lastModifiedAt: null,
    visualAuditStatus: "BASIC",
    auditNotes: [],
    auditTimestamp: null,
  });

  assert.equal(result.email, "hello@acme-roofing.com");
});

test("qualification scoring records reasons and uses configured weights", async () => {
  const normalized = normalizedCandidate();
  const fetchImpl = async () => htmlResponse(healthyHtml);
  const website = await inspectWebsite("https://www.acme-roofing.com/", {
    fetchImpl,
  });
  const contact = new PublicWebsiteContactProvider().discover(
    normalized,
    website,
  );
  const result = scoreProspect({
    candidate: normalized,
    website,
    contact,
    targetIndustries: ["roofing"],
  });

  assert.ok(result.businessQualityScore > 0);
  assert.ok(result.websiteOpportunityScore >= 0);
  assert.equal(result.contactabilityScore, 100);
  assert.ok(result.qualificationScore > 0);
  assert.ok(result.qualificationReasons.includes("public business email found"));
  assert.ok(result.qualificationReasons.includes("matches target industry"));
});

test("disqualification rules reject non-local, inactive, and chain businesses", () => {
  const website = {
    websitePresent: false,
    websiteReachable: false,
    httpStatus: null,
    httpsPresent: false,
    title: null,
    metaDescriptionPresent: false,
    viewportPresent: false,
    mobileResponsive: null,
    navigationLinkCount: 0,
    phoneLinks: [],
    emailLinks: [],
    contactLinks: [],
    contactPageUrl: null,
    formPresent: false,
    portfolioPresent: false,
    testimonialsPresent: false,
    imageCount: 0,
    socialLinks: [],
    pageCountEstimate: 0,
    brokenLinks: [],
    lastModifiedAt: null,
    visualAuditStatus: "NOT_INSPECTED" as const,
    auditNotes: [],
    auditTimestamp: null,
  };
  const contact = {
    email: null,
    emailFound: false,
    emailSourceUrl: null,
    phone: null,
    phoneFound: false,
    contactPageUrl: null,
    contactPageFound: false,
    notes: [],
  };

  const result = scoreProspect({
    candidate: normalizedCandidate({ localBusiness: false }),
    website,
    contact,
    targetIndustries: ["roofing"],
  });

  assert.equal(result.prospectStatus, "DISQUALIFIED");
  assert.ok(result.disqualificationReasons.includes("business is not local"));

  const chain = scoreProspect({
    candidate: normalizedCandidate({ locationCount: 50 }),
    website,
    contact,
    targetIndustries: ["roofing"],
  });
  assert.ok(chain.disqualificationReasons.includes("appears to be a national chain"));
});
