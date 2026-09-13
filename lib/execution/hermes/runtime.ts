import type {
  AgentExecutionRequest,
  AgentExecutionResult,
  AgentExecutionRuntime,
} from "../types";
import { HermesClient, type HermesRunResponse } from "./client";

export const HERMES_MODEL = "deepseek-v4-pro";
export const DEFAULT_POLL_INTERVAL_MS = 1_000;
export const DEFAULT_POLL_TIMEOUT_MS = 60_000;

const IN_PROGRESS_STATUSES = new Set(["started", "queued", "running"]);

export type HermesRuntimeOptions = {
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export class HermesRuntime implements AgentExecutionRuntime {
  constructor(private readonly options: HermesRuntimeOptions = {}) {}

  async execute(
    request: AgentExecutionRequest,
  ): Promise<AgentExecutionResult> {
    const { apiUrl, apiKey } = this.getConfiguration();
    const client = new HermesClient(apiUrl, apiKey);
    const pollIntervalMs =
      this.options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;

    const admission = await client.createRun(
      {
        model: HERMES_MODEL,
        instructions: request.instructions,
        input: request.input,
        output_schema: request.outputSchema,
        allowed_skills: [],
        allowed_tools: [],
      },
      request.runId,
    );

    const runtimeRunId = admission.run_id ?? admission.id ?? null;

    if (!runtimeRunId) {
      throw new Error("Hermes admission response is missing run_id.");
    }

    while (true) {
      const statusResponse = await client.getRun(runtimeRunId);

      if (statusResponse.status === "completed") {
        return this.toResult(runtimeRunId, statusResponse);
      }

      if (statusResponse.status === "failed") {
        throw new Error(this.getErrorMessage(statusResponse) || "Hermes run failed.");
      }

      if (
        statusResponse.status === "cancelled" ||
        statusResponse.status === "interrupted"
      ) {
        throw new Error(`Hermes run ${runtimeRunId} was ${statusResponse.status}.`);
      }

      if (
        !statusResponse.status ||
        !IN_PROGRESS_STATUSES.has(statusResponse.status)
      ) {
        throw new Error(
          `Hermes run ${runtimeRunId} returned unsupported status: ${statusResponse.status ?? "missing"}.`,
        );
      }

      if (Date.now() >= deadline) {
        throw new Error(
          `Hermes run ${runtimeRunId} timed out after ${timeoutMs}ms.`,
        );
      }

      await sleep(pollIntervalMs);
    }
  }

  private toResult(
    runtimeRunId: string,
    response: HermesRunResponse,
  ): AgentExecutionResult {
    const output = response.output ?? response.result ?? null;

    if (output === null) {
      throw new Error("Hermes completed without an output.");
    }

    return {
      runtimeRunId,
      output,
      modelProvider: this.getModelProvider(response),
      modelName: this.getModelName(response),
      inputTokens:
        response.input_tokens ?? response.usage?.input_tokens ?? null,
      outputTokens:
        response.output_tokens ?? response.usage?.output_tokens ?? null,
      estimatedCostUsd: response.estimated_cost_usd ?? null,
    };
  }

  private getModelName(response: HermesRunResponse): string | null {
    if (typeof response.model === "string") {
      return response.model;
    }

    return response.model?.name ?? response.model_name ?? null;
  }

  private getModelProvider(response: HermesRunResponse): string | null {
    if (typeof response.model === "string") {
      return null;
    }

    return response.model?.provider ?? response.model_provider ?? null;
  }

  private getErrorMessage(response: HermesRunResponse): string | null {
    if (typeof response.error === "string") {
      return response.error;
    }

    return response.error?.message ?? null;
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

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
