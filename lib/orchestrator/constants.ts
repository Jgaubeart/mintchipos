export const ORCHESTRATOR_INTENTS = [
  "BUILD_DEMO_FROM_URL",
  "CHECK_FACTORY_RUN",
  "SHOW_PREVIEW",
  "EXPLAIN_EXCEPTION",
  "GENERAL_OPERATOR_QUERY",
] as const;

export type OrchestratorIntent = (typeof ORCHESTRATOR_INTENTS)[number];

export const ORCHESTRATOR_TASK_STATUSES = [
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_APPROVAL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;

export type OrchestratorTaskStatus =
  (typeof ORCHESTRATOR_TASK_STATUSES)[number];

export const ORCHESTRATOR_MESSAGE_ROLES = [
  "USER",
  "ORCHESTRATOR",
  "SYSTEM_EVENT",
] as const;

export type OrchestratorMessageRole =
  (typeof ORCHESTRATOR_MESSAGE_ROLES)[number];

export const ORCHESTRATOR_INTENT_LABELS: Record<OrchestratorIntent, string> = {
  BUILD_DEMO_FROM_URL: "Build demo from URL",
  CHECK_FACTORY_RUN: "Check factory run",
  SHOW_PREVIEW: "Show preview",
  EXPLAIN_EXCEPTION: "Explain exception",
  GENERAL_OPERATOR_QUERY: "General query",
};

