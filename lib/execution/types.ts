export type RuntimeRunIdCallback = (
  runtimeRunId: string,
) => void | Promise<void>;

export type AgentExecutionRequest = {
  runId: string;
  projectId: string;
  agentDefinitionId: string;
  agentDefinitionVersionId: string;
  agentKey: string;
  instructions: string;
  input: unknown;
  projectContext?: string;
  outputSchema?: Record<string, unknown>;
  executionTimeoutMs?: number;
  onRuntimeRunId?: RuntimeRunIdCallback;
  modelPolicyKey: string | null;
  allowedSkills: unknown[];
  allowedTools: unknown[];
};

export type AgentExecutionResult = {
  runtimeRunId: string | null;
  output: unknown;
  modelProvider: string | null;
  modelName: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
};

export interface AgentExecutionRuntime {
  execute(
    request: AgentExecutionRequest,
  ): Promise<AgentExecutionResult>;
}
