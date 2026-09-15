import type { WebsiteFactoryRunStatus } from "@/lib/website-factory/constants";
import type { OrchestratorTaskStatus } from "./constants";

export function mapFactoryStatusToTaskStatus(
  factoryStatus: WebsiteFactoryRunStatus,
): OrchestratorTaskStatus {
  switch (factoryStatus) {
    case "NOT_STARTED":
      return "QUEUED";
    case "RUNNING":
      return "RUNNING";
    case "COMPLETED":
    case "READY_FOR_LIVE_VERIFICATION":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    default:
      return "QUEUED";
  }
}

