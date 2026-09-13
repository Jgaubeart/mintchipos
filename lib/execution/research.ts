export const RESEARCH_STRATEGIST_KEY = "RESEARCH_STRATEGIST";
export const RESEARCH_ARTIFACT_TYPE = "RESEARCH";
export const RESEARCH_ARTIFACT_TITLE = "Research";

export function shouldPersistResearchArtifact(agentKey: string): boolean {
  return agentKey === RESEARCH_STRATEGIST_KEY;
}
