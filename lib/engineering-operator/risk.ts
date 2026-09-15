import {
  ENGINEERING_PROHIBITED_ACTIONS,
  ENGINEERING_ALLOWED_ACTIONS,
} from "./constants";
import type {
  EngineeringIntent,
  EngineeringRiskLevel,
} from "./constants";
import type {
  EngineeringApprovalDecision,
} from "./types";

const CRITICAL_PATTERNS = [
  /\bdelete\b.*\bproduction\b/i,
  /\bdestroy\b.*\bdata\b/i,
  /\brotate\b.*\bsecret/i,
  /\bdisable\b.*\bauth/i,
  /\bdisable\b.*\brls\b/i,
  /\birreversible\b/i,
  /\bdrop\b.*\btable\b/i,
] as const;

const HIGH_PATTERNS = [
  /\bproduction deploy\b/i,
  /\bdeploy\b.*\bproduction\b/i,
  /\bchange\b.*\bdns\b/i,
  /\bauth(entication)? policy\b/i,
  /\bsecurity policy\b/i,
  /\bsecret(s)?\b/i,
  /\boutbound\b.*\bemail\b/i,
  /\bbilling\b/i,
  /\bprovider activation\b/i,
] as const;

const MEDIUM_PATTERNS = [
  /\bmigration\b/i,
  /\badd(itive)? dependency\b/i,
  /\bnew (internal )?route\b/i,
  /\bagent prompt\b/i,
  /\bagent contract\b/i,
  /\bpreview\b/i,
] as const;

const LOW_PATTERNS = [
  /\bcopy\b|\bui\b|\bcss\b|\bstyling\b/i,
  /\btest(s)?\b/i,
  /\bdocumentation\b|\bdocs\b/i,
  /\bfixture\b/i,
  /\binternal refactor\b/i,
] as const;

function matchesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function classifyEngineeringRisk(
  intent: EngineeringIntent,
  text: string,
): EngineeringRiskLevel {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (matchesAny(normalized, CRITICAL_PATTERNS)) {
    return "CRITICAL";
  }

  if (matchesAny(normalized, HIGH_PATTERNS)) {
    return "HIGH";
  }

  if (
    intent === "ENGINEERING_DEPLOY_PREVIEW" ||
    intent === "ENGINEERING_BUILD_FEATURE"
  ) {
    return matchesAny(normalized, LOW_PATTERNS) ? "LOW" : "MEDIUM";
  }

  if (
    intent === "ENGINEERING_FIX_BUG" &&
    !matchesAny(normalized, LOW_PATTERNS)
  ) {
    return "MEDIUM";
  }

  if (matchesAny(normalized, MEDIUM_PATTERNS)) {
    return "MEDIUM";
  }

  return "LOW";
}

export function resolveEngineeringApproval(input: {
  intent: EngineeringIntent;
  text: string;
  riskLevel: EngineeringRiskLevel;
  projectPolicyAllowsMediumAuto?: boolean;
}): EngineeringApprovalDecision {
  const riskLevel = input.riskLevel;
  const normalized = input.text.replace(/\s+/g, " ").trim();

  if (riskLevel === "CRITICAL") {
    return {
      approvalState: "REQUIRED",
      riskLevel,
      canStartImmediately: false,
      requiresExplicitApproval: true,
      requiresActionPlan: true,
      reason:
        "Critical production or credential action requires explicit owner approval and a specific action plan.",
    };
  }

  if (riskLevel === "HIGH") {
    return {
      approvalState: "REQUIRED",
      riskLevel,
      canStartImmediately: false,
      requiresExplicitApproval: true,
      requiresActionPlan: false,
      reason:
        "High-risk work is paused at the approval gate until the owner approves.",
    };
  }

  if (riskLevel === "LOW") {
    return {
      approvalState: "AUTO_APPROVED",
      riskLevel,
      canStartImmediately: true,
      requiresExplicitApproval: false,
      requiresActionPlan: false,
      reason:
        "Low-risk engineering work can execute automatically with scoped changes and verification.",
    };
  }

  const hasHighRiskSignal = matchesAny(normalized, HIGH_PATTERNS);
  if (hasHighRiskSignal) {
    return {
      approvalState: "REQUIRED",
      riskLevel,
      canStartImmediately: false,
      requiresExplicitApproval: true,
      requiresActionPlan: false,
      reason:
        "The request contains a high-risk signal even though the overall task is medium risk.",
    };
  }

  const canAuto = input.projectPolicyAllowsMediumAuto ?? true;
  return {
    approvalState: canAuto ? "AUTO_APPROVED" : "REQUIRED",
    riskLevel,
    canStartImmediately: canAuto,
    requiresExplicitApproval: !canAuto,
    requiresActionPlan: false,
    reason: canAuto
      ? "Medium-risk additive work is allowed by the current project policy."
      : "Medium-risk work requires approval because the current project policy does not permit automatic execution.",
  };
}

export function allowedEngineeringActions(
  riskLevel: EngineeringRiskLevel,
): string[] {
  return [...ENGINEERING_ALLOWED_ACTIONS[riskLevel]];
}

export function prohibitedEngineeringActions(): string[] {
  return [...ENGINEERING_PROHIBITED_ACTIONS];
}
