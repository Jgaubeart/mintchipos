import {
  getAgentDefinitionById,
  getAgentDefinitionVersionById,
  getAgentRunById,
} from "@/lib/agents/queries";
import { getProjectById } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { buildProjectContext } from "./context";
import { toExecutionFailure } from "./failure";
import { extractUserMessage } from "./input";
import { normalizeStructuredOutput } from "./output";
import {
  RESEARCH_ARTIFACT_TITLE,
  RESEARCH_ARTIFACT_TYPE,
  resolveExecutionTimeoutMs,
  shouldPersistResearchArtifact,
} from "./research";
import { getExecutionRuntime } from "./runtime";
import type { AgentExecutionRequest, AgentExecutionResult } from "./types";
import { validateAgentOutput } from "./validation";

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

  const userMessage = extractUserMessage(run.input_snapshot);
  const outputSchema = asOutputSchema(version.output_schema);
  const supabase = await createClient<Database>();

  const request: AgentExecutionRequest = {
    runId: run.id,
    projectId: project.id,
    agentDefinitionId: agent.id,
    agentDefinitionVersionId: version.id,
    agentKey: agent.key,
    instructions: version.instructions,
    input: userMessage,
    projectContext: buildProjectContext(project),
    outputSchema,
    executionTimeoutMs: resolveExecutionTimeoutMs(agent.key),
    onRuntimeRunId: async (runtimeRunId) => {
      try {
        await supabase.rpc("set_agent_run_runtime", {
          p_agent_run_id: run.id,
          p_runtime_provider: "HERMES",
          p_runtime_run_id: runtimeRunId,
        });
      } catch {
        // Best-effort: terminal paths still persist the runtime run id.
      }
    },
    modelPolicyKey: version.model_policy_key,
    allowedSkills: [],
    allowedTools: [],
  };

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
    const failure = toExecutionFailure(error);

    await supabase.rpc("fail_agent_run", {
      p_agent_run_id: run.id,
      p_error_code: failure.errorCode,
      p_error_message: failure.errorMessage,
      p_runtime_provider: "HERMES",
      p_runtime_run_id: failure.runtimeRunId,
    });

    throw new Error(failure.errorMessage);
  }

  const normalizedOutput = normalizeStructuredOutput(
    result.output,
    outputSchema,
  );

  const validation = validateAgentOutput(normalizedOutput, outputSchema);

  if (!validation.ok) {
    await supabase.rpc("fail_agent_run", {
      p_agent_run_id: run.id,
      p_error_code: "OUTPUT_VALIDATION_FAILED",
      p_error_message: validation.error,
    });

    throw new Error(validation.error);
  }

  if (shouldPersistResearchArtifact(agent.key)) {
    const { error: persistError } = await supabase.rpc(
      "persist_agent_output_artifact",
      {
        p_project_id: project.id,
        p_agent_run_id: run.id,
        p_artifact_type: RESEARCH_ARTIFACT_TYPE,
        p_title: RESEARCH_ARTIFACT_TITLE,
        p_content: JSON.stringify(normalizedOutput, null, 2) ?? "",
        p_structured_data: normalizedOutput,
      },
    );

    if (persistError) {
      await supabase.rpc("fail_agent_run", {
        p_agent_run_id: run.id,
        p_error_code: "ARTIFACT_PERSISTENCE_FAILED",
        p_error_message: persistError.message,
      });

      throw new Error(persistError.message);
    }
  }

  const durationMs = Date.now() - startedAt;

  const { error: completeError } = await supabase.rpc(
    "complete_agent_run_success",
    {
      p_agent_run_id: run.id,
      p_output_snapshot: normalizedOutput,
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

function asOutputSchema(
  value: unknown,
): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}
