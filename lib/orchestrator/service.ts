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
import type { OrchestratorReply } from "./types";

function formatPreviewReply(previewUrl: string): string {
  return `Demo is ready.\n\n[Open Preview](${previewUrl})`;
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

  switch (detection.intent) {
    case "SHOW_PREVIEW": {
      const run = await getLatestFactoryRunWithPreview();
      if (run?.preview_url) {
        reply = {
          content: formatPreviewReply(run.preview_url),
          intent: "SHOW_PREVIEW",
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
      const visualStage = Array.isArray(run?.stages)
        ? run.stages.find(
            (stage) =>
              typeof stage === "object" &&
              stage !== null &&
              stage.stage === "VISUAL_QA",
          )
        : null;
      const reasons: string[] = [];
      if (run?.failure_reason) {
        reasons.push(run.failure_reason);
      }
      if (visualStage?.output) {
        const output = visualStage.output as Record<string, unknown>;
        if (Array.isArray(output.demoLimitations) && output.demoLimitations.length) {
          reasons.push(
            `Demo limitations: ${output.demoLimitations.join(", ")}.`,
          );
        }
        if (Array.isArray(output.blockingDefects) && output.blockingDefects.length) {
          reasons.push(
            `Remaining defects: ${output.blockingDefects.join("; ")}.`,
          );
        }
      }

      reply = {
        content:
          reasons.length > 0
            ? `The Mint Chip demo is not fully production-ready because:\n\n- ${reasons.join("\n- ")}`
            : "The Mint Chip demo has no recorded production blocker in canonical state.",
        intent: "EXPLAIN_EXCEPTION",
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

  const orchestratorMessage = await createOrchestratorMessage({
    threadId: activeThread.id,
    role: "ORCHESTRATOR",
    content: reply.content,
    metadata: {
      intent: reply.intent,
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
    });
  }

  await updateOrchestratorThreadTitle(
    activeThread.id,
    intentTitle(detection.intent, detection.url),
  );

  return { threadId: activeThread.id, reply };
}
