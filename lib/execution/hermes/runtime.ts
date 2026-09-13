import type {
  AgentExecutionRequest,
  AgentExecutionResult,
  AgentExecutionRuntime,
} from "../types";
import { HermesClient } from "./client";

export class HermesRuntime implements AgentExecutionRuntime {
  async execute(
    request: AgentExecutionRequest,
  ): Promise<AgentExecutionResult> {
    const { apiUrl, apiKey } = this.getConfiguration();
    const client = new HermesClient(apiUrl, apiKey);

    const payload = {
      run_id: request.runId,
      agent_definition_key: request.agentKey,
      instructions: request.instructions,
      input: request.input,
      output_schema: request.outputSchema,
      model_policy_key: request.modelPolicyKey,
      allowed_skills: [],
      allowed_tools: [],
    };

    const response = await client.createRun(payload, request.runId);
    const output = response.output ?? response.result ?? null;

    if (output === null) {
      throw new Error("Hermes did not return a final result.");
    }

    return {
      runtimeRunId: response.run_id ?? response.id ?? null,
      output,
      modelProvider:
        response.model_provider ?? response.model?.provider ?? null,
      modelName: response.model_name ?? response.model?.name ?? null,
      inputTokens:
        response.input_tokens ?? response.usage?.input_tokens ?? null,
      outputTokens:
        response.output_tokens ?? response.usage?.output_tokens ?? null,
      estimatedCostUsd: response.estimated_cost_usd ?? null,
    };
  }

  private getConfiguration(): { apiUrl: string; apiKey: string } {
    const apiUrl = process.env.HERMES_API_URL?.trim();
    const apiKey = process.env.HERMES_API_KEY?.trim();

    if (!apiUrl) {
      throw new Error("HERMES_API_URL is not configured.");
    }

    if (!apiKey) {
      throw new Error("HERMES_API_KEY is not configured.");
    }

    return { apiUrl, apiKey };
  }
}
