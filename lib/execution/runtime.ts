import type { AgentExecutionRuntime } from "./types";
import { HermesRuntime } from "./hermes/runtime";

export function getExecutionRuntime(): AgentExecutionRuntime {
  return new HermesRuntime();
}
