export const AGENT_RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const AGENT_TRIGGER_TYPES = [
  "MANUAL",
  "WORKFLOW",
  "RETRY",
  "SYSTEM",
] as const;

export type AgentTriggerType = (typeof AGENT_TRIGGER_TYPES)[number];

export const AGENT_RUN_ARTIFACT_RELATIONSHIPS = [
  "INPUT",
  "OUTPUT",
  "REFERENCE",
] as const;

export type AgentRunArtifactRelationship =
  (typeof AGENT_RUN_ARTIFACT_RELATIONSHIPS)[number];
