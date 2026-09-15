import type {
  EngineeringApprovalState,
  EngineeringIntent,
  EngineeringProgressStage,
  EngineeringRiskLevel,
  EngineeringTaskEventType,
  EngineeringTaskStatus,
} from "./constants";

export type EngineeringTaskRow = {
  id: string;
  owner_id: string;
  orchestrator_thread_id: string | null;
  orchestrator_message_id: string | null;
  idempotency_key: string | null;
  title: string;
  description: string | null;
  intent: EngineeringIntent;
  category: string | null;
  priority: number;
  status: EngineeringTaskStatus;
  risk_level: EngineeringRiskLevel;
  repository: string;
  base_branch: string;
  working_branch: string | null;
  target_environment: string;
  approval_state: EngineeringApprovalState;
  execution_runtime: string | null;
  external_run_id: string | null;
  commit_sha: string | null;
  migration_references: string[];
  preview_deployment_id: string | null;
  verification_status: string | null;
  blocker: string | null;
  progress_stage: EngineeringProgressStage | null;
  tests_summary: string | null;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

export type EngineeringTask = EngineeringTaskRow;

export type EngineeringTaskEventRow = {
  id: string;
  task_id: string;
  type: EngineeringTaskEventType;
  summary: string;
  metadata: Record<string, unknown>;
  attempt: number;
  created_at: string | null;
};

export type EngineeringTaskEvent = EngineeringTaskEventRow;

export type EngineeringTaskArtifactRow = {
  id: string;
  task_id: string;
  kind: string;
  reference: string;
  metadata: Record<string, unknown>;
  created_at: string | null;
};

export type EngineeringTaskArtifact = EngineeringTaskArtifactRow;

export type EngineeringIntentDetection = {
  intent: EngineeringIntent | null;
  confidence: number;
};

export type EngineeringApprovalDecision = {
  approvalState: EngineeringApprovalState;
  riskLevel: EngineeringRiskLevel;
  canStartImmediately: boolean;
  requiresExplicitApproval: boolean;
  requiresActionPlan: boolean;
  reason: string;
};

export type EngineeringTaskEnvelope = {
  taskId: string;
  intent: EngineeringIntent;
  goal: string;
  acceptanceCriteria: string[];
  repository: string;
  baseBranch: string;
  workingBranch: string | null;
  allowedActions: string[];
  prohibitedActions: string[];
  riskLevel: EngineeringRiskLevel;
  approvalState: EngineeringApprovalState;
  previewRequested: boolean;
  projectContext: Record<string, unknown>;
  relevantFiles: string[];
  relevantDocs: string[];
};

export type ContinuationContext = {
  currentWork: string;
  knownIssues: string;
  websiteFactoryStatus: string;
  engineeringOperatorStatus: string | null;
  openTasks: Array<{
    id: string;
    title: string;
    status: EngineeringTaskStatus;
    blocker: string | null;
  }>;
  branchState: {
    currentBranch: string;
    clean: boolean;
  };
  nextDocumentedMilestone: string | null;
};

export type ContinuationPlan = {
  selectedTaskId: string | null;
  selectedTitle: string | null;
  reason: string;
  decisionRequest: string | null;
};

export type EngineeringExecutionResult = {
  status: EngineeringTaskStatus;
  workingBranch: string | null;
  commitSha: string | null;
  testsSummary: string | null;
  previewUrl: string | null;
  blocker: string | null;
  events: Array<{
    type: EngineeringTaskEventType;
    summary: string;
    metadata?: Record<string, unknown>;
  }>;
};
