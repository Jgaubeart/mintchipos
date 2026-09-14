import {
  AUTHENTICITY_RULES,
  ONE_PAGE_SUGGESTED_SECTIONS,
} from "../design-brief/constants";
import { createEmptyDesignBrief } from "../design-brief/defaults";
import type {
  DesignBriefProject,
} from "../design-brief/types";
import type { IndustryPlaybook } from "../playbooks/types";
import { MINT_CHIP_BUSINESS_RULES } from "./constants";
import type {
  AutoDesignBriefResult,
  BusinessResearch,
  IndustryClassification,
} from "./types";

export function buildAutoDesignBrief(input: {
  project: DesignBriefProject;
  research: BusinessResearch;
  classification: IndustryClassification;
  playbook: IndustryPlaybook | null;
}): AutoDesignBriefResult {
  const brief = createEmptyDesignBrief(input.project);

  brief.source = "AGENT";
  brief.project.businessName =
    input.research.businessName || input.project.name;
  brief.project.industry = input.classification.primaryIndustry;
  brief.project.industrySubtype = input.classification.subtype;
  brief.project.businessLocation = [
    input.research.city,
    input.research.state,
  ]
    .filter(Boolean)
    .join(", ");
  brief.project.existingWebsiteUrl = input.research.websiteUrl;
  brief.project.description =
    input.research.description ?? input.project.description ?? "";

  brief.businessAudience.businessDescription =
    input.research.description ?? "Local business website.";
  brief.businessAudience.servicesProducts = input.research.services;
  brief.businessAudience.primaryTargetCustomer =
    input.playbook?.targetCustomer ?? "Local customers";
  brief.businessAudience.geographicMarket =
    input.research.serviceAreas.join(", ") || "Local service area";
  brief.businessAudience.customerPriorities =
    input.playbook?.customerPriorities ?? ["Clear services", "Trust"];
  brief.businessAudience.customerPainPoints =
    input.playbook?.painPoints ?? ["Hard-to-find information"];
  brief.businessAudience.commonObjections =
    input.playbook?.commonObjections ?? ["Unclear next step"];
  brief.businessAudience.trustFactors =
    input.playbook?.trustSignals ?? ["Reviews", "Credentials"];

  brief.websiteGoals.primaryGoal = "GENERATE_LEADS";
  brief.websiteGoals.primaryCtaConcept = "Get a quote";
  brief.websiteGoals.secondaryCtaConcept = "Call the business";
  brief.websiteGoals.primaryDesiredAction =
    "Contact the business with a clear next step.";
  brief.websiteGoals.firstImpression =
    "Professional, credible, and easy to act on.";

  brief.brandPersonality.traits = ["APPROACHABLE", "TRUSTWORTHY", "LOCAL"];
  brief.brandPersonality.description =
    "A credible local business that feels human and dependable.";
  brief.brandPersonality.desiredFeeling =
    "Confident the business is the right, low-risk choice.";

  brief.typography.characteristics = ["MODERN_SANS"];
  brief.typography.restraintLevel = 3;

  brief.contentDirection.voice = ["DIRECT", "FRIENDLY"];
  brief.contentDirection.desiredMessaging =
    "Clear, concise local-business copy with an obvious next step.";
  brief.contentDirection.aiMayCreateNewCopy = true;

  brief.siteFormat.format = MINT_CHIP_BUSINESS_RULES.defaultSiteFormat;
  brief.siteFormat.suggestedItems = [...ONE_PAGE_SUGGESTED_SECTIONS];
  brief.siteFormat.selectedItems = [...ONE_PAGE_SUGGESTED_SECTIONS];
  brief.siteFormat.suggestionSource = "WEBSITE_FACTORY";

  brief.demoConversionUx.primaryCtaConcept = "Get a quote";
  brief.demoConversionUx.secondaryCtaConcept = "Call the business";
  brief.demoConversionUx.phoneCtaDesired = Boolean(input.research.phone);
  brief.demoConversionUx.quoteFormDesired = true;
  brief.demoConversionUx.stickyMobileCta = true;
  brief.demoConversionUx.persistentHeaderCta = true;

  brief.creativeAuthority.level =
    MINT_CHIP_BUSINESS_RULES.defaultCreativeAuthorityLevel;

  brief.hardConstraints.mustPreserve =
    input.playbook?.trustSignals.slice(0, 3) ?? [];
  brief.hardConstraints.mustNotInclude = [
    ...input.playbook?.designClichesToAvoid ?? [],
    "Invented customer reviews",
    "Invented completed client projects",
  ];
  brief.hardConstraints.brandRequirements = [...AUTHENTICITY_RULES];
  brief.hardConstraints.accessibilityConsiderations =
    input.playbook?.accessibilityComplianceNotes ?? ["Sufficient contrast"];

  return {
    brief,
    precedence: [...MINT_CHIP_BUSINESS_RULES.decisionPrecedence],
    lineage: {
      businessResearch: true,
      industryPlaybook: Boolean(input.playbook),
      systemRules: true,
    },
  };
}
