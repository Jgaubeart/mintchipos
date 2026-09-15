export type RemoteRunStatus =
  | "started"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted"
  | "unknown";

export function canRecoverCompletedRemoteRun(
  status: string | null | undefined,
): boolean {
  return status === "completed";
}

export function shouldPollRemoteRun(
  status: string | null | undefined,
): boolean {
  return (
    status === "started" ||
    status === "queued" ||
    status === "running" ||
    status === "unknown"
  );
}

export function buildPollPlan(input: {
  startedAtMs: number;
  overallDeadlineMs: number;
  pollIntervalMs: number;
}): { remainingMs: number; nextPollMs: number } {
  const remainingMs = Math.max(
    0,
    input.overallDeadlineMs - (Date.now() - input.startedAtMs),
  );

  return {
    remainingMs,
    nextPollMs: Math.min(input.pollIntervalMs, remainingMs),
  };
}

