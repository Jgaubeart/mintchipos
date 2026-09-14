import {
  DEFAULT_QUALIFICATION_WEIGHTS,
  INDUSTRIES_THAT_TYPICALLY_NEED_PORTFOLIO,
  QUALIFIED_SCORE_THRESHOLD,
} from "./constants";
import type {
  ContactDiscoveryResult,
  NormalizedCandidate,
  QualificationResult,
  WebsiteInspectionResult,
} from "./types";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function industryMatches(
  industry: string | null,
  targetIndustries: string[],
): boolean {
  if (!industry) {
    return false;
  }

  const normalized = industry.toLowerCase().trim();
  return targetIndustries.some(
    (target) => target.toLowerCase().trim() === normalized,
  );
}

function industryNeedsPortfolio(industry: string | null): boolean {
  if (!industry) {
    return false;
  }

  const normalized = industry.toLowerCase().trim();
  return INDUSTRIES_THAT_TYPICALLY_NEED_PORTFOLIO.some(
    (candidate) =>
      candidate === normalized ||
      normalized.includes(candidate) ||
      candidate.includes(normalized),
  );
}

function scoreBusinessQuality(
  candidate: NormalizedCandidate,
  targetIndustries: string[],
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const isTargetIndustry = industryMatches(candidate.industry, targetIndustries);

  if (candidate.localBusiness === true) {
    score += 30;
    reasons.push("strong local business indicators");
  } else if (candidate.localBusiness !== false) {
    score += 10;
  }

  if (candidate.appearsActive === true) {
    score += 20;
    reasons.push("appears to be an active business");
  }

  if (isTargetIndustry) {
    score += 20;
    reasons.push("matches target industry");
  } else {
    score += 5;
  }

  if (candidate.locationCount !== null && candidate.locationCount <= 5) {
    score += 15;
    reasons.push("small / local footprint");
  } else if (candidate.locationCount === null) {
    score += 5;
  }

  if (candidate.reviewPresence === true) {
    score += 10;
  }

  if (candidate.address) {
    score += 5;
  }

  if (candidate.confidence !== null && candidate.confidence >= 0.6) {
    score += 5;
  }

  return { score: clamp(score), reasons };
}

function scoreWebsiteOpportunity(
  candidate: NormalizedCandidate,
  website: WebsiteInspectionResult,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  if (!website.websitePresent) {
    return { score: 100, reasons: ["no website detected"] };
  }

  if (!website.websiteReachable) {
    return { score: 95, reasons: ["existing website is unreachable"] };
  }

  let score = 0;

  if (!website.httpsPresent) {
    score += 25;
    reasons.push("existing website is missing HTTPS");
  }

  if (website.mobileResponsive === false || !website.viewportPresent) {
    score += 20;
    reasons.push("existing website is reachable but lacks a mobile viewport");
  }

  if (website.contactLinks.length === 0) {
    score += 15;
    reasons.push("no obvious contact CTA");
  }

  if (website.phoneLinks.length === 0) {
    score += 10;
    reasons.push("no phone CTA");
  }

  if (!website.formPresent) {
    score += 5;
    reasons.push("limited conversion UX");
  }

  if (website.pageCountEstimate <= 2) {
    score += 15;
    reasons.push("very thin site");
  }

  if (website.brokenLinks.length > 0) {
    score += 10;
    reasons.push("broken links detected");
  }

  if (industryNeedsPortfolio(candidate.industry) && !website.portfolioPresent) {
    score += 10;
    reasons.push("missing portfolio where this industry commonly benefits");
  }

  if (website.emailLinks.length === 0) {
    score += 5;
    reasons.push("weak public contact visibility");
  }

  return { score: clamp(score), reasons };
}

function scoreContactability(
  candidate: NormalizedCandidate,
  website: WebsiteInspectionResult,
  contact: ContactDiscoveryResult,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (contact.emailFound) {
    score += 35;
    reasons.push("public business email found");
  }

  if (contact.contactPageFound) {
    score += 25;
    reasons.push("contact page found");
  }

  if (contact.phoneFound || candidate.phone) {
    score += 30;
    reasons.push("public phone contact found");
  }

  if (website.contactLinks.length > 0) {
    score += 10;
    reasons.push("contact route visible on website");
  }

  return { score: clamp(score), reasons };
}

function contactabilityConfidence(
  contact: ContactDiscoveryResult,
): number | null {
  const found = [
    contact.emailFound,
    contact.phoneFound,
    contact.contactPageFound,
  ].filter(Boolean).length;

  if (found === 0) {
    return null;
  }

  return found === 1 ? 0.5 : found === 2 ? 0.75 : 0.9;
}

export function scoreProspect(input: {
  candidate: NormalizedCandidate;
  website: WebsiteInspectionResult;
  contact: ContactDiscoveryResult;
  targetIndustries: string[];
}): QualificationResult {
  const business = scoreBusinessQuality(
    input.candidate,
    input.targetIndustries,
  );
  const website = scoreWebsiteOpportunity(input.candidate, input.website);
  const contactScore = scoreContactability(
    input.candidate,
    input.website,
    input.contact,
  );

  const weighted =
    business.score * DEFAULT_QUALIFICATION_WEIGHTS.businessFit +
    website.score * DEFAULT_QUALIFICATION_WEIGHTS.websiteOpportunity +
    contactScore.score * DEFAULT_QUALIFICATION_WEIGHTS.contactability;

  const qualificationScore = clamp(weighted);
  const disqualificationReasons: string[] = [];

  if (input.candidate.localBusiness === false) {
    disqualificationReasons.push("business is not local");
  }
  if (input.candidate.appearsActive === false) {
    disqualificationReasons.push("business does not appear active");
  }
  if (
    input.candidate.locationCount !== null &&
    input.candidate.locationCount > 20
  ) {
    disqualificationReasons.push("appears to be a national chain");
  }

  const qualificationReasons = [
    ...business.reasons,
    ...website.reasons,
    ...contactScore.reasons,
  ];

  return {
    businessQualityScore: business.score,
    websiteOpportunityScore: website.score,
    contactabilityScore: contactScore.score,
    qualificationScore,
    contactabilityConfidence: contactabilityConfidence(input.contact),
    disqualificationReasons,
    qualificationReasons,
    prospectStatus:
      disqualificationReasons.length > 0
        ? "DISQUALIFIED"
        : qualificationScore >= QUALIFIED_SCORE_THRESHOLD
          ? "QUALIFIED"
          : "AUDIT_PENDING",
  };
}
