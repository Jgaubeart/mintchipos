import { after } from "next/server";
import { detectIntent, intentTitle } from "./intents";
import {
  createOrchestratorMessage,
  createOrchestratorTask,
  createOrchestratorThread,
  getLatestFactoryRun,
  getLatestFactoryRunWithPreview,
  getOrchestratorThread,
  updateOrchestratorThreadTitle,
} from "./queries";
import { resolveProductionReadiness } from "./readiness";
import type { OrchestratorReply } from "./types";
import type { OrchestratorTaskStatus } from "./constants";
import {
  createEngineeringTask,
  createEngineeringTaskEvent,
  getEngineeringTaskById,
  getEngineeringTaskByIdempotencyKey,
  updateEngineeringTask,
} from "@/lib/engineering-operator/queries";
import {
  classifyEngineeringRisk,
  resolveEngineeringApproval,
} from "@/lib/engineering-operator/risk";
import {
  engineeringIntentTitle,
  suggestEngineeringBranch,
} from "@/lib/engineering-operator/intents";
import { buildEngineeringTaskEnvelope } from "@/lib/engineering-operator/envelope";
import {
  executeEngineeringTask,
  engineeringExecutionIdempotencyKey,
} from "@/lib/engineering-operator/executor";
import { defaultEngineeringRuntime } from "@/lib/engineering-operator/runtime";
import { ENGINEERING_INTENTS } from "@/lib/engineering-operator/constants";
import type { EngineeringTask } from "@/lib/supabase/database.types";
import type {
  EngineeringIntent,
  EngineeringTaskStatus,
} from "@/lib/engineering-operator/constants";

function engineeringReplyFromTask(
  task: EngineeringTask,
): OrchestratorReply {
  return {
    content:
      task.status === "WAITING_FOR_APPROVAL"
        ? "Engineering task created and paused at the approval gate."
        : "Engineering task created.",
    intent: task.intent,
    task: {
      title: task.title,
      status: mapEngineeringStatus(task.status),
      engineeringTaskId: task.id,
      workingBranch: task.working_branch,
      commitSha: task.commit_sha,
      progress: task.progress_stage,
      tests: task.tests_summary,
      riskLevel: task.risk_level,
      approvalState: task.approval_state,
      blocker: task.blocker,
    },
  };
}

function mapEngineeringStatus(
  status: EngineeringTaskStatus,
): OrchestratorTaskStatus {
  switch (status) {
    case "SUCCEEDED":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    case "CANCELLED":
      return "CANCELLED";
    case "WAITING_FOR_APPROVAL":
      return "WAITING_FOR_APPROVAL";
    default:
      return "RUNNING";
  }
}

async function executeQueuedEngineeringTask(taskId: string): Promise<void> {
  try {
    const task = await getEngineeringTaskById(taskId);
    if (!task) {
      return;
    }

    const envelope = buildEngineeringTaskEnvelope({ task });
    await executeEngineeringTask({
      task,
      envelope,
      runtime: defaultEngineeringRuntime,
      callbacks: {
        addEvent: async (event) => {
          await createEngineeringTaskEvent({
            taskId: event.taskId,
            type: event.type,
            summary: event.summary,
            metadata: event.metadata,
          });
        },
        updateTask: async (update) => {
          await updateEngineeringTask({
            taskId: update.taskId,
            status: update.status,
            workingBranch: update.workingBranch,
            commitSha: update.commitSha,
            testsSummary: update.testsSummary,
            previewDeploymentId: update.previewDeploymentId,
            verificationStatus: update.verificationStatus,
            blocker: update.blocker,
            progressStage:
              (update.progressStage as
                | "Planning"
                | "Coding"
                | "Testing"
                | "Deploying Preview"
                | "Complete"
                | null) ?? null,
            startedAt: update.startedAt,
            completedAt: update.completedAt,
          });
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Engineering execution failed.";
    await updateEngineeringTask({
      taskId,
      status: "BLOCKED",
      blocker: message,
    });
    await createEngineeringTaskEvent({
      taskId,
      type: "BLOCKED",
      summary: message,
    });
  }
}

async function handleEngineeringRequest(input: {
  userId: string;
  content: string;
  threadId: string;
  orchestratorMessageId: string | null;
}): Promise<OrchestratorReply> {
  const detection = detectIntent(input.content);
  if (!(ENGINEERING_INTENTS as readonly string[]).includes(detection.intent)) {
    throw new Error("Engineering request expected.");
  }
  const intent = detection.intent as EngineeringIntent;
  const riskLevel = classifyEngineeringRisk(intent, input.content);
  const approval = resolveEngineeringApproval({
    intent,
    text: input.content,
    riskLevel,
  });
  const idempotencyKey = engineeringExecutionIdempotencyKey({
    ownerId: input.userId,
    content: input.content,
  });

  const existing = await getEngineeringTaskByIdempotencyKey({
    ownerId: input.userId,
    idempotencyKey,
  });

  let task: EngineeringTask;
  if (existing) {
    task = existing;
  } else {
    task = await createEngineeringTask({
      ownerId: input.userId,
      idempotencyKey,
      title: engineeringIntentTitle(intent, input.content),
      description: input.content,
      intent,
      category: intent.replace(/^ENGINEERING_/, ""),
      priority:
        approval.riskLevel === "CRITICAL"
          ? 1
          : approval.riskLevel === "HIGH"
            ? 2
            : 3,
      status: approval.canStartImmediately
        ? "QUEUED"
        : "WAITING_FOR_APPROVAL",
      riskLevel: approval.riskLevel,
      approvalState: approval.approvalState,
      workingBranch: suggestEngineeringBranch(intent, input.content),
      orchestratorThreadId: input.threadId,
      orchestratorMessageId: input.orchestratorMessageId,
    });

    await createEngineeringTaskEvent({
      taskId: task.id,
      type: "TASK_CREATED",
      summary: "Engineering task created from Orchestrator chat.",
    });
  }

  if (approval.canStartImmediately) {
    after(() => executeQueuedEngineeringTask(task.id));
  }

  return engineeringReplyFromTask(task);
}

export async function runOrchestratorMessage(input: {
  userId: string;
  content: string;
  threadId?: string | null;
}): Promise<{
  threadId: string;
  reply: OrchestratorReply;
}> {
  const detection = detectIntent(input.content);
  const thread =
    input.threadId
      ? await getOrchestratorThread(input.threadId)
      : null;
  const activeThread =
    thread ??
    (await createOrchestratorThread({
      ownerId: input.userId,
      title: intentTitle(detection.intent, detection.url),
    }));

  await createOrchestratorMessage({
    threadId: activeThread.id,
    role: "USER",
    content: input.content,
  });

  let reply: OrchestratorReply;

  if ((ENGINEERING_INTENTS as readonly string[]).includes(detection.intent)) {
    reply = await handleEngineeringRequest({
      userId: input.userId,
      content: input.content,
      threadId: activeThread.id,
      orchestratorMessageId: null,
    });
  } else {
  switch (detection.intent) {
    case "SHOW_PREVIEW": {
      const run = await getLatestFactoryRunWithPreview();
      if (run?.preview_url) {
        reply = {
          content: "Demo is ready.",
          intent: "SHOW_PREVIEW",
          actions: [
            {
              label: "Open Preview",
              href: run.preview_url,
              kind: "preview",
            },
          ],
          task: {
            title: "Latest Mint Chip demo",
            status: "SUCCEEDED",
            previewUrl: run.preview_url,
            factoryRunId: run.id,
          },
        };
      } else {
        reply = {
          content:
            "I do not see a deployed preview yet. Check the Website Factory run status or start a new demo.",
          intent: "SHOW_PREVIEW",
          task: null,
        };
      }
      break;
    }

    case "EXPLAIN_EXCEPTION": {
      const run = await getLatestFactoryRun();
      const readiness = resolveProductionReadiness(run);
      const parts: string[] = [];

      if (readiness.previewReady) {
        parts.push(
          "The demo is live and functionally working, but it is not production-ready yet.",
        );
      }

      if (readiness.blockingDefects.length > 0) {
        parts.push(
          `Visual QA has ${readiness.blockingDefects.length} blocking interaction defect${readiness.blockingDefects.length === 1 ? "" : "s"}: ${readiness.blockingDefects.join("; ")}.`,
        );
      }

      if (readiness.demoLimitations.length > 0) {
        parts.push(
          `Demo-only limitations: ${readiness.demoLimitations.join(", ")}.`,
        );
      }

      if (readiness.failureReason) {
        parts.push(`Factory exception: ${readiness.failureReason}.`);
      }

      if (parts.length === 0) {
        parts.push(
          "The demo has no recorded production blocker in canonical state.",
        );
      }

      parts.push(
        readiness.visualQaStatus === "FAILED"
          ? "Once the blocking defects are fixed, the preview can move to PASSED_WITH_DEMO_LIMITATIONS."
          : "The factual placeholders still need real business data before production.",
      );

      reply = {
        content: parts.join(" "),
        intent: "EXPLAIN_EXCEPTION",
        actions: readiness.previewUrl
          ? [
              {
                label: "Open Preview",
                href: readiness.previewUrl,
                kind: "preview",
              },
            ]
          : [],
        task: run
          ? {
              title: "Latest factory run",
              status: "SUCCEEDED",
              factoryRunId: run.id,
              previewUrl: run.preview_url,
            }
          : null,
      };
      break;
    }

    case "BUILD_DEMO_FROM_URL": {
      reply = {
        content: `I can build a demo for ${detection.url ?? "that URL"}. Live Website Factory execution is gated by the current paid-runtime policy, so I created a queued task rather than starting new paid work automatically.`,
        intent: "BUILD_DEMO_FROM_URL",
        task: {
          title: intentTitle("BUILD_DEMO_FROM_URL", detection.url),
          status: "WAITING_FOR_APPROVAL",
        },
      };
      break;
    }

    case "CHECK_FACTORY_RUN": {
      const run = await getLatestFactoryRun();
      reply = {
        content: run
          ? `The latest Website Factory run is ${run.status} and is currently at stage ${run.current_stage ?? "unknown"}.`
          : "I do not see a Website Factory run in canonical state yet.",
        intent: "CHECK_FACTORY_RUN",
        task: run
          ? {
              title: "Latest factory run",
              status: "SUCCEEDED",
              factoryRunId: run.id,
              previewUrl: run.preview_url,
            }
          : null,
      };
      break;
    }

    default:
      reply = {
        content:
          "I can build demos from URLs, check Website Factory runs, show the latest preview, and explain recorded exceptions. Try: \"Show me the latest Mint Chip demo.\"",
        intent: "GENERAL_OPERATOR_QUERY",
        task: null,
      };
      break;
  }
  }

  const orchestratorMessage = await createOrchestratorMessage({
    threadId: activeThread.id,
    role: "ORCHESTRATOR",
    content: reply.content,
    metadata: {
      intent: reply.intent,
      actions: reply.actions ?? [],
    },
  });

  if (reply.task) {
    await createOrchestratorTask({
      threadId: activeThread.id,
      messageId: orchestratorMessage.id,
      intent: reply.intent,
      status: reply.task.status,
      factoryRunId: reply.task.factoryRunId ?? null,
      deploymentId: null,
      engineeringTaskId: reply.task.engineeringTaskId ?? null,
    });
  }

  await updateOrchestratorThreadTitle(
    activeThread.id,
    reply.task?.title ??
      intentTitle(detection.intent, detection.url),
  );

  return { threadId: activeThread.id, reply };
}
