import type {
  AgentExecutionRequest,
  AgentExecutionResult,
  AgentExecutionRuntime,
} from "../types";
import { buildStructuredOutputInstructions } from "../prompt";
import { HermesClient, type HermesRunResponse } from "./client";

export const HERMES_MODEL = "deepseek-v4-pro";
export const DEFAULT_POLL_INTERVAL_MS = 1_000;
export const DEFAULT_POLL_TIMEOUT_MS = 180_000;

const IN_PROGRESS_STATUSES = new Set(["started", "queued", "running"]);

export type HermesRuntimeOptions = {
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export class HermesPollTimeoutError extends Error {
  readonly kind = "hermes_poll_timeout";

  constructor(
    readonly runtimeRunId: string,
    readonly timeoutMs: number,
  ) {
    super(
      `Hermes run ${runtimeRunId} timed out after ${timeoutMs}ms. The remote run may still be active.`,
    );
    this.name = "HermesPollTimeoutError";
  }
}

export class HermesRuntime implements AgentExecutionRuntime {
  constructor(private readonly options: HermesRuntimeOptions = {}) {}

  async execute(
    request: AgentExecutionRequest,
  ): Promise<AgentExecutionResult> {
    const { apiUrl, apiKey } = this.getConfiguration();
    const client = new HermesClient(apiUrl, apiKey);
    const pollIntervalMs =
      this.options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const timeoutMs =
      request.executionTimeoutMs ??
      this.options.timeoutMs ??
      DEFAULT_POLL_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;

    const payload: Record<string, unknown> = {
      model: HERMES_MODEL,
      instructions: this.buildInstructions(request),
      input: this.buildHermesInput(request),
      allowed_skills: [],
      allowed_tools: [],
    };

    if (request.outputSchema != null) {
      payload.output_schema = request.outputSchema;
    }

    const admission = await client.createRun(payload, request.runId);

    const runtimeRunId = admission.run_id ?? admission.id ?? null;

    if (!runtimeRunId) {
      throw new Error("Hermes admission response is missing run_id.");
    }

    if (request.onRuntimeRunId) {
      await request.onRuntimeRunId(runtimeRunId);
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
        throw new HermesPollTimeoutError(runtimeRunId, timeoutMs);
      }

      await sleep(pollIntervalMs);
    }
  }

  private buildInstructions(request: AgentExecutionRequest): string {
    if (request.outputSchema == null) {
      return request.instructions;
    }

    return [
      request.instructions,
      buildStructuredOutputInstructions(request.outputSchema),
    ].join("\n\n");
  }

  private buildHermesInput(request: AgentExecutionRequest): unknown {
    const input = request.input;
    const projectContext = request.projectContext?.trim();

    if (typeof input === "string") {
      const value = input.trim();

      if (!value) {
        throw new Error("Hermes input is missing a user message.");
      }

      if (projectContext) {
        return [
          {
            role: "user",
            content: `${projectContext}\n\nUser request:\n${value}`,
          },
        ];
      }

      return [{ role: "user", content: value }];
    }

    if (Array.isArray(input)) {
      if (input.length === 0) {
        throw new Error("Hermes input is missing a user message.");
      }

      if (projectContext) {
        return [{ role: "user", content: projectContext }, ...input];
      }

      return input;
    }

    throw new Error("Hermes input must be a string or a message list.");
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
