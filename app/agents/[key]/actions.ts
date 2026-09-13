"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { CreateTestRunFormState } from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createTestRun(
  _previousState: CreateTestRunFormState,
  formData: FormData,
): Promise<CreateTestRunFormState> {
  await requireUser();

  const projectId = String(formData.get("project_id") ?? "").trim();
  const agentDefinitionId = String(
    formData.get("agent_definition_id") ?? "",
  ).trim();
  const input = String(formData.get("input") ?? "").trim();

  if (!UUID_PATTERN.test(projectId)) {
    return {
      error: null,
      fieldErrors: { project_id: "Select a project." },
    };
  }

  if (!input) {
    return {
      error: null,
      fieldErrors: { input: "Enter an input for this agent." },
    };
  }

  if (!UUID_PATTERN.test(agentDefinitionId)) {
    return { error: "Invalid agent definition.", fieldErrors: {} };
  }

  const supabase = await createClient<Database>();
  const { data, error } = await supabase.rpc("create_agent_run", {
    p_project_id: projectId,
    p_agent_definition_id: agentDefinitionId,
    p_input_snapshot: { user_message: input },
  });

  if (error || !data) {
    return {
      error: error?.message || "Unable to create the test run.",
      fieldErrors: {},
    };
  }

  redirect(`/runs/${data}`);
}
