"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { executeAgentRun } from "@/lib/execution/execute";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function executeRun(formData: FormData): Promise<void> {
  await requireUser();

  const runId = String(formData.get("run_id") ?? "").trim();

  if (!UUID_PATTERN.test(runId)) {
    redirect(`/runs/${encodeURIComponent(runId)}?error=${encodeURIComponent("Invalid run.")}`);
  }

  try {
    await executeAgentRun(runId);
    redirect(`/runs/${encodeURIComponent(runId)}?ok=${encodeURIComponent("Run executed successfully.")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Run execution failed.";
    redirect(`/runs/${encodeURIComponent(runId)}?error=${encodeURIComponent(message)}`);
  }
}
