import {
  allowedEngineeringActions,
  prohibitedEngineeringActions,
} from "./risk";
import type { EngineeringTask, EngineeringTaskEnvelope } from "./types";

export function buildEngineeringTaskEnvelope(input: {
  task: EngineeringTask;
  acceptanceCriteria?: string[];
  projectContext?: Record<string, unknown>;
  relevantFiles?: string[];
  relevantDocs?: string[];
}): EngineeringTaskEnvelope {
  const criteria =
    input.acceptanceCriteria && input.acceptanceCriteria.length > 0
      ? input.acceptanceCriteria
      : [
          "The change is scoped to the requested engineering goal.",
          "The relevant lint, typecheck, tests, and build checks pass.",
          "The result is committed on a focused feature branch.",
        ];

  return {
    taskId: input.task.id,
    intent: input.task.intent,
    goal: input.task.title,
    acceptanceCriteria: criteria,
    repository: input.task.repository,
    baseBranch: input.task.base_branch,
    allowedActions: allowedEngineeringActions(input.task.risk_level),
    prohibitedActions: prohibitedEngineeringActions(),
    riskLevel: input.task.risk_level,
    approvalState: input.task.approval_state,
    projectContext: input.projectContext ?? {},
    relevantFiles: input.relevantFiles ?? [],
    relevantDocs: input.relevantDocs ?? [
      "docs/architecture.md",
      "docs/current-work.md",
      "docs/testing.md",
      "docs/known-issues.md",
    ],
  };
}
