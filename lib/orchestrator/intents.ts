import type { OrchestratorIntent } from "./constants";
import type { IntentDetection } from "./types";
import {
  detectEngineeringIntent,
  engineeringIntentTitle,
} from "../engineering-operator/intents";

const URL_PATTERN =
  /\bhttps?:\/\/[^\s"'<>()]+/i;

function containsUrl(text: string): string | null {
  return text.match(URL_PATTERN)?.[0] ?? null;
}

export function detectIntent(text: string): IntentDetection {
  const normalized = text.trim();
  const engineering = detectEngineeringIntent(normalized);
  if (engineering.intent) {
    return {
      intent: engineering.intent,
      url: null,
      confidence: engineering.confidence,
    };
  }

  const url = containsUrl(normalized);

  if (url && /build|create|generate|demo/i.test(normalized)) {
    return {
      intent: "BUILD_DEMO_FROM_URL",
      url,
      confidence: 0.98,
    };
  }

  if (url) {
    return {
      intent: "BUILD_DEMO_FROM_URL",
      url,
      confidence: 0.85,
    };
  }

  if (/why|fail|exception|error|not ready|production/i.test(normalized)) {
    return {
      intent: "EXPLAIN_EXCEPTION",
      url: null,
      confidence: 0.9,
    };
  }

  if (/latest|show|open|preview|demo/i.test(normalized)) {
    return {
      intent: "SHOW_PREVIEW",
      url: null,
      confidence: 0.92,
    };
  }

  if (/status|run|progress|working/i.test(normalized)) {
    return {
      intent: "CHECK_FACTORY_RUN",
      url: null,
      confidence: 0.88,
    };
  }

  return {
    intent: "GENERAL_OPERATOR_QUERY",
    url: null,
    confidence: 0.7,
  };
}

export function intentTitle(
  intent: OrchestratorIntent,
  url: string | null,
): string {
  if (intent === "BUILD_DEMO_FROM_URL" && url) {
    try {
      return `Demo for ${new URL(url).hostname}`;
    } catch {
      return "Website demo";
    }
  }

  if (intent === "SHOW_PREVIEW") {
    return "Show latest preview";
  }

  if (intent === "EXPLAIN_EXCEPTION") {
    return "Explain exception";
  }

  if (intent === "CHECK_FACTORY_RUN") {
    return "Check factory run";
  }

  if (
    intent === "ENGINEERING_FIX_BUG" ||
    intent === "ENGINEERING_BUILD_FEATURE" ||
    intent === "ENGINEERING_CONTINUE_PROJECT" ||
    intent === "ENGINEERING_RUN_TESTS" ||
    intent === "ENGINEERING_INSPECT_FAILURE" ||
    intent === "ENGINEERING_DEPLOY_PREVIEW" ||
    intent === "ENGINEERING_SHOW_STATUS"
  ) {
    return engineeringIntentTitle(intent, "");
  }

  return "Operator query";
}
