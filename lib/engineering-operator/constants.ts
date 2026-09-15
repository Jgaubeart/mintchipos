export const ENGINEERING_INTENTS = [
  "ENGINEERING_FIX_BUG",
  "ENGINEERING_BUILD_FEATURE",
  "ENGINEERING_CONTINUE_PROJECT",
  "ENGINEERING_RUN_TESTS",
  "ENGINEERING_INSPECT_FAILURE",
  "ENGINEERING_DEPLOY_PREVIEW",
  "ENGINEERING_SHOW_STATUS",
] as const;

export type EngineeringIntent = (typeof ENGINEERING_INTENTS)[number];

export const ENGINEERING_TASK_STATUSES = [
  "DRAFT",
  "QUEUED",
  "PLANNING",
  "RUNNING",
  "WAITING_FOR_APPROVAL",
  "VERIFYING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "BLOCKED",
] as const;

export type EngineeringTaskStatus =
  (typeof ENGINEERING_TASK_STATUSES)[number];

export const ENGINEERING_RISK_LEVELS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export type EngineeringRiskLevel = (typeof ENGINEERING_RISK_LEVELS)[number];

export const ENGINEERING_APPROVAL_STATES = [
  "NOT_REQUIRED",
  "AUTO_APPROVED",
  "REQUIRED",
  "GRANTED",
  "DENIED",
] as const;

export type EngineeringApprovalState =
  (typeof ENGINEERING_APPROVAL_STATES)[number];

export const ENGINEERING_TASK_EVENTS = [
  "TASK_CREATED",
  "PLANNING_STARTED",
  "BRANCH_CREATED",
  "FILES_CHANGED",
  "TESTS_STARTED",
  "TESTS_PASSED",
  "TESTS_FAILED",
  "MIGRATION_CREATED",
  "MIGRATION_APPLIED",
  "PREVIEW_DEPLOYED",
  "APPROVAL_REQUIRED",
  "BLOCKED",
  "COMPLETED",
] as const;

export type EngineeringTaskEventType =
  (typeof ENGINEERING_TASK_EVENTS)[number];

export const ENGINEERING_PROGRESS_STAGES = [
  "Planning",
  "Coding",
  "Testing",
  "Deploying Preview",
  "Complete",
] as const;

export type EngineeringProgressStage =
  (typeof ENGINEERING_PROGRESS_STAGES)[number];

export const ENGINEERING_INTENT_LABELS: Record<
  EngineeringIntent,
  string
> = {
  ENGINEERING_FIX_BUG: "Fix bug",
  ENGINEERING_BUILD_FEATURE: "Build feature",
  ENGINEERING_CONTINUE_PROJECT: "Continue project",
  ENGINEERING_RUN_TESTS: "Run tests",
  ENGINEERING_INSPECT_FAILURE: "Inspect failure",
  ENGINEERING_DEPLOY_PREVIEW: "Deploy preview",
  ENGINEERING_SHOW_STATUS: "Show engineering status",
};

export const ENGINEERING_RISK_LABELS: Record<
  EngineeringRiskLevel,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const DEFAULT_ENGINEERING_REPOSITORY =
  "https://github.com/Jgaubeart/mintchipos";

export const DEFAULT_ENGINEERING_BASE_BRANCH = "main";

export const MAX_ENGINEERING_REPAIR_ATTEMPTS = 3;

export const ENGINEERING_ALLOWED_ACTIONS = {
  LOW: [
    "inspect repository",
    "inspect docs and tests",
    "create focused feature branch",
    "edit copy and UI",
    "add and update tests",
    "run lint, typecheck, tests, and build",
    "commit scoped changes",
    "update engineering status docs",
  ],
  MEDIUM: [
    "inspect repository",
    "inspect docs and tests",
    "create focused feature branch",
    "edit internal application code",
    "add additive database migration",
    "prepare non-production preview",
    "run lint, typecheck, tests, and build",
    "commit scoped changes",
  ],
  HIGH: [
    "inspect repository",
    "inspect logs and tests",
    "prepare an explicit action plan",
  ],
  CRITICAL: [
    "inspect repository and produce an explicit action plan",
  ],
} as const satisfies Record<
  EngineeringRiskLevel,
  readonly string[]
>;

export const ENGINEERING_PROHIBITED_ACTIONS = [
  "merge main",
  "push destructive production changes",
  "change production DNS",
  "charge money",
  "delete production data",
  "rotate secrets",
  "create arbitrary billable infrastructure",
  "bypass authentication",
  "bypass RLS",
  "expose secrets",
  "silently approve high-risk operations",
] as const;
