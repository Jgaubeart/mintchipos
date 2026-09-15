"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { runOrchestratorMessage } from "@/lib/orchestrator/service";

export async function sendOrchestratorMessage(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  const threadId = String(formData.get("thread_id") ?? "").trim() || null;

  if (!content) {
    redirect(`/orchestrator${threadId ? `?thread=${threadId}` : ""}`);
  }

  try {
    const result = await runOrchestratorMessage({
      userId: user.id,
      content,
      threadId,
    });
    redirect(`/orchestrator?thread=${encodeURIComponent(result.threadId)}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Orchestrator request failed.";
    redirect(
      `/orchestrator${threadId ? `?thread=${encodeURIComponent(threadId)}` : ""}?error=${encodeURIComponent(message)}`,
    );
  }
}

