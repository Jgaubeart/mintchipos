export const RESEARCH_STRATEGIST_KEY = "RESEARCH_STRATEGIST";
export const RESEARCH_ARTIFACT_TYPE = "RESEARCH";
export const RESEARCH_ARTIFACT_TITLE = "Research";
export const RESEARCH_STRATEGIST_TIMEOUT_MS = 300_000;

export function shouldPersistResearchArtifact(agentKey: string): boolean {
  return agentKey === RESEARCH_STRATEGIST_KEY;
}

export function resolveExecutionTimeoutMs(
  agentKey: string,
): number | undefined {
  if (agentKey === RESEARCH_STRATEGIST_KEY) {
    return RESEARCH_STRATEGIST_TIMEOUT_MS;
  }

  return undefined;
}
