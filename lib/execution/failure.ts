import { HermesPollTimeoutError } from "./hermes/runtime";

export type ExecutionFailure = {
  errorCode: string;
  errorMessage: string;
  runtimeRunId?: string;
};

export function toExecutionFailure(error: unknown): ExecutionFailure {
  if (error instanceof HermesPollTimeoutError) {
    return {
      errorCode: "HERMES_POLL_TIMEOUT",
      errorMessage: error.message,
      runtimeRunId: error.runtimeRunId,
    };
  }

  return {
    errorCode: "HERMES_EXECUTION_FAILED",
    errorMessage:
      error instanceof Error && error.message
        ? error.message
        : "Unknown execution error.",
  };
}
