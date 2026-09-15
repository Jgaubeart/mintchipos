import {
  ENGINEERING_INTENT_LABELS,
  type EngineeringIntent,
} from "./constants";
import type { EngineeringIntentDetection } from "./types";

const FIX_PATTERN =
  /\b(fix|repair|resolve|debug)\b|\bbug\b|\bdefect\b|\bbroken\b|\bnot working\b/i;
const FEATURE_PATTERN =
  /\b(add|build|implement|create|develop|write)\b.*\b(feature|support|page|route|integration|draft|generation)\b/i;
const CONTINUE_PATTERN =
  /\bcontinue\b.*\bbuilding\b|\bcontinue\b.*\bmintchipos\b|\bovernight\b|\bpick up where\b/i;
const TEST_PATTERN =
  /\brun\b.*\b(test|tests|verify|suite)\b|\bverify\b|\bnpm run verify\b/i;
const FAILURE_PATTERN =
  /\bwhy\b.*\bfail|\bwhat failed\b|\bfailure\b|\blast deployment failed\b|\binspect\b.*\bfailure\b/i;
const PREVIEW_PATTERN =
  /\bdeploy\b.*\bpreview\b|\bpreview deploy\b|\bopen a preview\b/i;
const STATUS_PATTERN =
  /\bshow\b.*\bstatus\b|\bengineering status\b|\bwhat is (?:the )?(?:engineering )?status\b/i;

function firstMatch(
  text: string,
  pattern: RegExp,
): boolean {
  return pattern.test(text);
}

export function detectEngineeringIntent(
  text: string,
): EngineeringIntentDetection {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (firstMatch(normalized, CONTINUE_PATTERN)) {
    return {
      intent: "ENGINEERING_CONTINUE_PROJECT",
      confidence: 0.95,
    };
  }

  if (firstMatch(normalized, PREVIEW_PATTERN)) {
    return {
      intent: "ENGINEERING_DEPLOY_PREVIEW",
      confidence: 0.93,
    };
  }

  if (firstMatch(normalized, TEST_PATTERN)) {
    return {
      intent: "ENGINEERING_RUN_TESTS",
      confidence: 0.96,
    };
  }

  if (firstMatch(normalized, FAILURE_PATTERN)) {
    return {
      intent: "ENGINEERING_INSPECT_FAILURE",
      confidence: 0.9,
    };
  }

  if (firstMatch(normalized, STATUS_PATTERN)) {
    return {
      intent: "ENGINEERING_SHOW_STATUS",
      confidence: 0.9,
    };
  }

  if (firstMatch(normalized, FIX_PATTERN)) {
    return {
      intent: "ENGINEERING_FIX_BUG",
      confidence: 0.88,
    };
  }

  if (firstMatch(normalized, FEATURE_PATTERN)) {
    return {
      intent: "ENGINEERING_BUILD_FEATURE",
      confidence: 0.85,
    };
  }

  return { intent: null, confidence: 0 };
}

export function engineeringIntentTitle(
  intent: EngineeringIntent,
  text: string,
): string {
  const compact = text.replace(/\s+/g, " ").trim();
  const firstSentence = compact.split(/[.!?]/, 1)[0]?.trim() ?? compact;

  if (intent === "ENGINEERING_CONTINUE_PROJECT") {
    return "Continue building MintChipOS";
  }

  if (intent === "ENGINEERING_RUN_TESTS") {
    return "Run verification suite";
  }

  if (intent === "ENGINEERING_INSPECT_FAILURE") {
    return "Inspect recent failure";
  }

  if (intent === "ENGINEERING_DEPLOY_PREVIEW") {
    return "Deploy current branch to preview";
  }

  if (intent === "ENGINEERING_SHOW_STATUS") {
    return "Show engineering status";
  }

  if (!firstSentence) {
    return ENGINEERING_INTENT_LABELS[intent];
  }

  if (firstSentence.length > 80) {
    return `${firstSentence.slice(0, 77)}...`;
  }

  return firstSentence;
}

export function suggestEngineeringBranch(
  intent: EngineeringIntent,
  text: string,
): string {
  const slug = text
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");

  const prefixByIntent: Record<EngineeringIntent, string> = {
    ENGINEERING_FIX_BUG: "fix",
    ENGINEERING_BUILD_FEATURE: "feature",
    ENGINEERING_CONTINUE_PROJECT: "continue",
    ENGINEERING_RUN_TESTS: "verify",
    ENGINEERING_INSPECT_FAILURE: "inspect",
    ENGINEERING_DEPLOY_PREVIEW: "preview",
    ENGINEERING_SHOW_STATUS: "status",
  };

  const safeSlug = slug || "task";
  return `milestone-5/${prefixByIntent[intent]}-${safeSlug}`;
}
