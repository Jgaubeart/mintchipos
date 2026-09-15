import type {
  EngineeringTask,
  EngineeringTaskEnvelope,
  EngineeringExecutionResult,
} from "./types";
import type {
  EngineeringTaskEventType,
  EngineeringTaskStatus,
} from "./constants";

export type EngineeringRuntime = {
  executeTask(envelope: EngineeringTaskEnvelope): Promise<EngineeringExecutionResult>;
};

export type EngineeringExecutorCallbacks = {
  addEvent(input: {
    taskId: string;
    type: EngineeringTaskEventType;
    summary: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  updateTask(input: {
    taskId: string;
    status: EngineeringTaskStatus;
    workingBranch?: string | null;
    commitSha?: string | null;
    testsSummary?: string | null;
    previewDeploymentId?: string | null;
    verificationStatus?: string | null;
    blocker?: string | null;
    progressStage?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  }): Promise<void>;
};

function shouldStart(task: EngineeringTask): boolean {
  return (
    task.status !== "SUCCEEDED" &&
    task.status !== "FAILED" &&
    task.status !== "CANCELLED" &&
    task.approval_state !== "DENIED"
  );
}

export async function executeEngineeringTask(input: {
  task: EngineeringTask;
  envelope: EngineeringTaskEnvelope;
  runtime: EngineeringRuntime;
  callbacks: EngineeringExecutorCallbacks;
}): Promise<EngineeringExecutionResult> {
  const { task, envelope } = input;

  if (!shouldStart(task)) {
    return {
      status: task.status,
      workingBranch: task.working_branch,
      commitSha: task.commit_sha,
      testsSummary: task.tests_summary,
      previewUrl: task.preview_deployment_id,
      blocker: task.blocker,
      events: [],
    };
  }

  if (
    task.approval_state === "REQUIRED" ||
    task.status === "WAITING_FOR_APPROVAL"
  ) {
    await input.callbacks.updateTask({
      taskId: task.id,
      status: "WAITING_FOR_APPROVAL",
      blocker: "Owner approval is required before execution.",
    });
    await input.callbacks.addEvent({
      taskId: task.id,
      type: "APPROVAL_REQUIRED",
      summary: "Engineering execution is paused at the approval gate.",
    });

    return {
      status: "WAITING_FOR_APPROVAL",
      workingBranch: task.working_branch,
      commitSha: task.commit_sha,
      testsSummary: task.tests_summary,
      previewUrl: task.preview_deployment_id,
      blocker: "Owner approval is required before execution.",
      events: [
        {
          type: "APPROVAL_REQUIRED",
          summary: "Engineering execution is paused at the approval gate.",
        },
      ],
    };
  }

  await input.callbacks.updateTask({
    taskId: task.id,
    status: "PLANNING",
    progressStage: "Planning",
    startedAt: task.started_at ?? new Date().toISOString(),
  });
  await input.callbacks.addEvent({
    taskId: task.id,
    type: "PLANNING_STARTED",
    summary: "Planning the scoped engineering change.",
  });

  const result = await input.runtime.executeTask(envelope);

  await input.callbacks.updateTask({
    taskId: task.id,
    status: result.status,
    workingBranch: result.workingBranch,
    commitSha: result.commitSha,
    testsSummary: result.testsSummary,
    previewDeploymentId: result.previewUrl,
    verificationStatus:
      result.status === "SUCCEEDED" ? "PASSED" : result.status,
    blocker: result.blocker,
    progressStage:
      result.status === "SUCCEEDED"
        ? "Complete"
        : result.status === "BLOCKED"
          ? "Coding"
          : "Complete",
    completedAt:
      result.status === "SUCCEEDED" ||
      result.status === "FAILED" ||
      result.status === "BLOCKED"
        ? new Date().toISOString()
        : null,
  });

  for (const event of result.events) {
    await input.callbacks.addEvent({
      taskId: task.id,
      type: event.type,
      summary: event.summary,
      metadata: event.metadata,
    });
  }

  return result;
}

export function engineeringExecutionIdempotencyKey(input: {
  ownerId: string;
  content: string;
}): string {
  const normalized = input.content.trim().replace(/\s+/g, " ").toLowerCase();
  return `engineering:${input.ownerId}:${normalized}`;
}
