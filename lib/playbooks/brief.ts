import {
  PLAYBOOK_BRIEF_SCHEMA_VERSION,
  RESEARCH_QUESTION_TOPICS,
  type ResearchQuestionTopic,
} from "./constants";
import type { PlaybookBrief } from "./types";

export function createEmptyPlaybookBrief(
  overrides: Partial<PlaybookBrief> = {},
): PlaybookBrief {
  return {
    schemaVersion: PLAYBOOK_BRIEF_SCHEMA_VERSION,
    industry: {
      industryName: "",
      industrySubtype: "",
      typicalBusinessSize: "",
      geographicFocus: "",
      notes: "",
    },
    targetMarket: {
      typicalTargetCustomer: "",
      typicalBuyerPriorities: [],
      commonProductsServices: [],
      primaryConversionGoals: [],
    },
    researchScope: {
      numberOfReferenceSites: 5,
      researchDirectCompetitors: true,
      researchPremiumExamples: true,
      researchAdjacentIndustries: true,
      researchLocalExamples: true,
      researchNationalExamples: true,
    },
    researchQuestions: [...RESEARCH_QUESTION_TOPICS],
    evidenceRequirements: {
      minimumSourceCount: 5,
      sourceUrlsRequired: true,
      distinguishObservationFromRecommendation: true,
      distinguishFactFromInference: true,
      confidenceUncertaintyNotes: true,
      doNotInventUnsupportedClaims: true,
    },
    ...overrides,
  };
}

export type PlaybookBriefValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function validatePlaybookBrief(value: unknown): PlaybookBriefValidationResult {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Playbook brief must be an object."] };
  }

  const brief = value as unknown as PlaybookBrief;
  const errors: string[] = [];

  if (brief.schemaVersion !== PLAYBOOK_BRIEF_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${PLAYBOOK_BRIEF_SCHEMA_VERSION}.`);
  }
  if (!isNonEmptyString(brief.industry?.industryName)) {
    errors.push("industry.industryName is required.");
  }

  const scope = brief.researchScope;
  if (
    typeof scope?.numberOfReferenceSites !== "number" ||
    !Number.isInteger(scope.numberOfReferenceSites) ||
    scope.numberOfReferenceSites < 1 ||
    scope.numberOfReferenceSites > 100
  ) {
    errors.push("researchScope.numberOfReferenceSites must be an integer from 1 to 100.");
  }

  if (!Array.isArray(brief.researchQuestions)) {
    errors.push("researchQuestions must be an array.");
  } else {
    for (const question of brief.researchQuestions as ResearchQuestionTopic[]) {
      if (!RESEARCH_QUESTION_TOPICS.includes(question)) {
        errors.push(`researchQuestions contains an invalid topic: ${String(question)}.`);
      }
    }
  }

  const evidence = brief.evidenceRequirements;
  if (
    typeof evidence?.minimumSourceCount !== "number" ||
    !Number.isInteger(evidence.minimumSourceCount) ||
    evidence.minimumSourceCount < 1
  ) {
    errors.push("evidenceRequirements.minimumSourceCount must be a positive integer.");
  }

  assertStringArray(brief.targetMarket?.typicalBuyerPriorities, "targetMarket.typicalBuyerPriorities", errors);
  assertStringArray(brief.targetMarket?.commonProductsServices, "targetMarket.commonProductsServices", errors);
  assertStringArray(brief.targetMarket?.primaryConversionGoals, "targetMarket.primaryConversionGoals", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

function assertStringArray(value: unknown, path: string, errors: string[]): void {
  if (value === undefined || value === null) {
    return;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${path} must be an array of strings.`);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
