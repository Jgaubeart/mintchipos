import test from "node:test";
import assert from "node:assert/strict";
import {
  detectEngineeringIntent,
} from "../lib/engineering-operator/intents";
import {
  classifyEngineeringRisk,
  resolveEngineeringApproval,
  prohibitedEngineeringActions,
} from "../lib/engineering-operator/risk";
import { buildContinuationPlan } from "../lib/engineering-operator/planner";
import { buildEngineeringTaskEnvelope } from "../lib/engineering-operator/envelope";
import {
  engineeringExecutionIdempotencyKey,
  executeEngineeringTask,
  type EngineeringRuntime,
} from "../lib/engineering-operator/executor";
import type {
  EngineeringExecutionResult,
  EngineeringTask,
} from "../lib/engineering-operator/types";

function task(overrides: Partial<EngineeringTask> = {}): EngineeringTask {
  return {
    id: "task-1",
    owner_id: "owner-1",
    orchestrator_thread_id: "thread-1",
    orchestrator_message_id: "message-1",
    idempotency_key: "engineering:owner-1:fix the bug",
    title: "Fix the preview link rendering bug",
    description: "Fix the preview link rendering bug.",
    intent: "ENGINEERING_FIX_BUG",
    category: "FIX_BUG",
    priority: 3,
    status: "QUEUED",
    risk_level: "LOW",
    repository: "https://github.com/Jgaubeart/mintchipos",
    base_branch: "main",
    working_branch: "milestone-5/fix-preview-link",
    target_environment: "PREVIEW",
    approval_state: "AUTO_APPROVED",
    execution_runtime: "LOCAL_REPOSITORY",
    external_run_id: null,
    commit_sha: null,
    migration_references: [],
    preview_deployment_id: null,
    verification_status: null,
    blocker: null,
    progress_stage: "Planning",
    tests_summary: null,
    created_at: null,
    started_at: null,
    completed_at: null,
    updated_at: null,
    ...overrides,
  };
}

test("detects deterministic engineering intents", () => {
  assert.equal(
    detectEngineeringIntent("Fix the Visual QA production-readiness bug.")
      .intent,
    "ENGINEERING_FIX_BUG",
  );
  assert.equal(
    detectEngineeringIntent("Run npm run verify and report the result.")
      .intent,
    "ENGINEERING_RUN_TESTS",
  );
  assert.equal(
    detectEngineeringIntent("Why did the last deployment fail?").intent,
    "ENGINEERING_INSPECT_FAILURE",
  );
  assert.equal(
    detectEngineeringIntent("Deploy the current feature branch to preview.")
      .intent,
    "ENGINEERING_DEPLOY_PREVIEW",
  );
  assert.equal(
    detectEngineeringIntent("Continue building MintChipOS overnight.")
      .intent,
    "ENGINEERING_CONTINUE_PROJECT",
  );
  assert.equal(
    detectEngineeringIntent("Add outreach draft generation.").intent,
    "ENGINEERING_BUILD_FEATURE",
  );
});

test("does not misclassify ordinary operator chat as engineering", () => {
  assert.equal(
    detectEngineeringIntent("Show me the latest Mint Chip demo.").intent,
    null,
  );
});

test("classifies risk from request signals", () => {
  assert.equal(
    classifyEngineeringRisk("ENGINEERING_FIX_BUG", "Fix a typo in UI copy"),
    "LOW",
  );
  assert.equal(
    classifyEngineeringRisk(
      "ENGINEERING_BUILD_FEATURE",
      "Add a new internal route",
    ),
    "MEDIUM",
  );
  assert.equal(
    classifyEngineeringRisk(
      "ENGINEERING_DEPLOY_PREVIEW",
      "Deploy the feature branch to preview",
    ),
    "MEDIUM",
  );
  assert.equal(
    classifyEngineeringRisk(
      "ENGINEERING_DEPLOY_PREVIEW",
      "Deploy to production and change DNS",
    ),
    "HIGH",
  );
  assert.equal(
    classifyEngineeringRisk(
      "ENGINEERING_FIX_BUG",
      "Delete all production customer data",
    ),
    "CRITICAL",
  );
});

test("low-risk work auto-executes and high/critical work requires approval", () => {
  const low = resolveEngineeringApproval({
    intent: "ENGINEERING_FIX_BUG",
    text: "Fix a UI copy typo",
    riskLevel: "LOW",
  });
  assert.equal(low.canStartImmediately, true);
  assert.equal(low.approvalState, "AUTO_APPROVED");

  const high = resolveEngineeringApproval({
    intent: "ENGINEERING_DEPLOY_PREVIEW",
    text: "Deploy to production",
    riskLevel: "HIGH",
  });
  assert.equal(high.canStartImmediately, false);
  assert.equal(high.approvalState, "REQUIRED");

  const critical = resolveEngineeringApproval({
    intent: "ENGINEERING_FIX_BUG",
    text: "Delete all production customer data",
    riskLevel: "CRITICAL",
  });
  assert.equal(critical.requiresActionPlan, true);
  assert.equal(critical.canStartImmediately, false);
});

test("medium risk respects project policy", () => {
  const paused = resolveEngineeringApproval({
    intent: "ENGINEERING_BUILD_FEATURE",
    text: "Add a new internal route",
    riskLevel: "MEDIUM",
    projectPolicyAllowsMediumAuto: false,
  });
  assert.equal(paused.approvalState, "REQUIRED");
  assert.equal(paused.canStartImmediately, false);
});

test("task envelope is targeted and never includes whole project history", () => {
  const envelope = buildEngineeringTaskEnvelope({
    task: task(),
    acceptanceCriteria: ["Preview actions render as a real button."],
    relevantFiles: ["app/orchestrator/page.tsx"],
    relevantDocs: ["docs/current-work.md"],
  });

  assert.equal(envelope.taskId, "task-1");
  assert.equal(envelope.intent, "ENGINEERING_FIX_BUG");
  assert.ok(envelope.allowedActions.includes("create focused feature branch"));
  assert.ok(
    envelope.prohibitedActions.includes("silently approve high-risk operations"),
  );
  assert.ok(!Object.keys(envelope.projectContext).includes("projectHistory"));
});

test("continuation planner prefers an existing non-blocked engineering task", () => {
  const plan = buildContinuationPlan({
    currentWork: "## Active work order\n### Objective\nShip a website.",
    knownIssues: "",
    websiteFactoryStatus: "",
    engineeringOperatorStatus: null,
    openTasks: [
      { id: "task-a", title: "Fix preview link", status: "RUNNING", blocker: null },
      { id: "task-b", title: "Deploy preview", status: "WAITING_FOR_APPROVAL", blocker: null },
    ],
    branchState: { currentBranch: "main", clean: true },
    nextDocumentedMilestone: null,
  });

  assert.equal(plan.selectedTaskId, "task-a");
  assert.equal(plan.decisionRequest, null);
});

test("continuation planner surfaces a blocked factory decision instead of inventing work", () => {
  const plan = buildContinuationPlan({
    currentWork: "",
    knownIssues: "",
    websiteFactoryStatus: "| Component | Status |\n| Live Vercel preview | BLOCKED |",
    engineeringOperatorStatus: null,
    openTasks: [],
    branchState: { currentBranch: "main", clean: true },
    nextDocumentedMilestone: null,
  });

  assert.equal(plan.selectedTitle, "Live Vercel preview");
  assert.match(plan.decisionRequest ?? "", /external credentials/);
});

test("idempotency keys are stable per owner and request", () => {
  const first = engineeringExecutionIdempotencyKey({
    ownerId: "owner-1",
    content: "Run the full test suite.",
  });
  const second = engineeringExecutionIdempotencyKey({
    ownerId: "owner-1",
    content: "Run the full test suite.",
  });

  assert.equal(first, second);
  assert.ok(first.startsWith("engineering:owner-1:"));
});

const successfulRuntime: EngineeringRuntime = {
  async executeTask(): Promise<EngineeringExecutionResult> {
    return {
      status: "SUCCEEDED",
      workingBranch: "milestone-5/fix-preview-link",
      commitSha: "abc1234",
      testsSummary: "119/119",
      previewUrl: null,
      blocker: null,
      events: [
        { type: "TESTS_STARTED", summary: "Tests started." },
        { type: "TESTS_PASSED", summary: "Tests passed." },
        { type: "COMPLETED", summary: "Task complete." },
      ],
    };
  },
};

test("auto-approved engineering task executes and persists result events", async () => {
  const events: Array<{ type: string; summary: string }> = [];
  const updates: Array<{ status: string }> = [];

  const result = await executeEngineeringTask({
    task: task(),
    envelope: buildEngineeringTaskEnvelope({ task: task() }),
    runtime: successfulRuntime,
    callbacks: {
      addEvent: async (event) => {
        events.push({ type: event.type, summary: event.summary });
      },
      updateTask: async (update) => {
        updates.push({ status: update.status });
      },
    },
  });

  assert.equal(result.status, "SUCCEEDED");
  assert.equal(result.commitSha, "abc1234");
  assert.ok(events.some((event) => event.type === "TESTS_PASSED"));
  assert.ok(updates.some((update) => update.status === "SUCCEEDED"));
});

test("approval-required engineering task pauses without calling the runtime", async () => {
  let runtimeCalled = false;
  const runtime: EngineeringRuntime = {
    async executeTask() {
      runtimeCalled = true;
      return {
        status: "SUCCEEDED",
        workingBranch: null,
        commitSha: null,
        testsSummary: null,
        previewUrl: null,
        blocker: null,
        events: [],
      };
    },
  };

  const result = await executeEngineeringTask({
    task: task({
      status: "WAITING_FOR_APPROVAL",
      approval_state: "REQUIRED",
    }),
    envelope: buildEngineeringTaskEnvelope({
      task: task({
        status: "WAITING_FOR_APPROVAL",
        approval_state: "REQUIRED",
      }),
    }),
    runtime,
    callbacks: {
      addEvent: async () => {},
      updateTask: async () => {},
    },
  });

  assert.equal(result.status, "WAITING_FOR_APPROVAL");
  assert.equal(runtimeCalled, false);
});

test("already-completed engineering work is not executed again", async () => {
  let runtimeCalled = false;
  const runtime: EngineeringRuntime = {
    async executeTask() {
      runtimeCalled = true;
      return {
        status: "SUCCEEDED",
        workingBranch: null,
        commitSha: null,
        testsSummary: null,
        previewUrl: null,
        blocker: null,
        events: [],
      };
    },
  };

  const completed = task({ status: "SUCCEEDED" });
  const result = await executeEngineeringTask({
    task: completed,
    envelope: buildEngineeringTaskEnvelope({ task: completed }),
    runtime,
    callbacks: {
      addEvent: async () => {},
      updateTask: async () => {},
    },
  });

  assert.equal(result.status, "SUCCEEDED");
  assert.equal(runtimeCalled, false);
});

test("engineering operator never exposes arbitrary shell execution", () => {
  const prohibited = prohibitedEngineeringActions();
  assert.ok(prohibited.includes("bypass authentication"));
  assert.ok(prohibited.includes("bypass RLS"));
  assert.ok(!prohibited.includes("run arbitrary shell command"));
});
