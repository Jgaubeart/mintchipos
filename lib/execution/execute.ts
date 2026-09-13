import {
  getAgentDefinitionById,
  getAgentDefinitionVersionById,
  getAgentRunById,
} from "@/lib/agents/queries";
import { getProjectById } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getExecutionRuntime } from "./runtime";
import type { AgentExecutionRequest, AgentExecutionResult } from "./types";
import { validateExecutionAcknowledgement } from "./validation";

const OUTPUT_SCHEMA = {
  type: "object",
  required: ["acknowledged", "projectName", "summary"],
  properties: {
    acknowledged: { type: "boolean" },
    projectName: { type: "string" },
    summary: { type: "string" },
  },
};

export async function executeAgentRun(runId: string): Promise<void> {
  const run = await getAgentRunById(runId);

  if (!run) {
    throw new Error("Run not found.");
  }

  if (run.status !== "PENDING") {
    throw new Error("Only pending runs can be executed.");
  }

  const [project, agent, version] = await Promise.all([
    getProjectById(run.project_id),
    getAgentDefinitionById(run.agent_definition_id),
    getAgentDefinitionVersionById(run.agent_definition_version_id),
  ]);

  if (!project || !agent || !version) {
    throw new Error("Run references missing project, agent, or version data.");
  }

  const request: AgentExecutionRequest = {
    runId: run.id,
    projectId: project.id,
    agentDefinitionId: agent.id,
    agentDefinitionVersionId: version.id,
    agentKey: agent.key,
    instructions: version.instructions,
    input: {
      project: `${project.project_number ?? "MC-0000"} — ${project.name}`,
      task:
        "Return a short structured execution acknowledgement proving that you received the MintChipOS project context. Do not perform external research. Do not use tools. Do not modify files. Do not create project strategy.",
    },
    outputSchema: OUTPUT_SCHEMA,
    modelPolicyKey: version.model_policy_key,
    allowedSkills: [],
    allowedTools: [],
  };

  const supabase = await createClient<Database>();
  const { error: markError } = await supabase.rpc("mark_agent_run_running", {
    p_agent_run_id: run.id,
  });

  if (markError) {
    throw new Error(markError.message);
  }

  const startedAt = Date.now();
  const runtime = getExecutionRuntime();

  let result: AgentExecutionResult;

  try {
    result = await runtime.execute(request);
  } catch (error) {
    const message = safeErrorMessage(error);

    await supabase.rpc("fail_agent_run", {
      p_agent_run_id: run.id,
      p_error_code: "HERMES_EXECUTION_FAILED",
      p_error_message: message,
    });

    throw new Error(message);
  }

  const validation = validateExecutionAcknowledgement(result.output);

  if (!validation.ok) {
    await supabase.rpc("fail_agent_run", {
      p_agent_run_id: run.id,
      p_error_code: "OUTPUT_VALIDATION_FAILED",
      p_error_message: validation.error,
    });

    throw new Error(validation.error);
  }

  const durationMs = Date.now() - startedAt;

  const { error: completeError } = await supabase.rpc(
    "complete_agent_run_success",
    {
      p_agent_run_id: run.id,
      p_output_snapshot: result.output,
      p_model_provider: result.modelProvider,
      p_model_name: result.modelName,
      p_model_policy_key: version.model_policy_key,
      p_runtime_provider: "HERMES",
      p_runtime_run_id: result.runtimeRunId,
      p_duration_ms: durationMs,
      p_input_tokens: result.inputTokens,
      p_output_tokens: result.outputTokens,
      p_estimated_cost_usd: result.estimatedCostUsd,
    },
  );

  if (completeError) {
    throw new Error(completeError.message);
  }
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown execution error.";
}
