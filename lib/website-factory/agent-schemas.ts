import type { WebsiteFactoryStage } from "./constants";

export const CRITICAL_AGENT_STAGE_MAP: Partial<
  Record<WebsiteFactoryStage, string>
> = {
  DESIGN_BRIEF: "ORCHESTRATOR",
  UX_CONTENT_STRATEGY: "UX_CONTENT_STRATEGIST",
  CREATIVE_DIRECTION: "CREATIVE_DIRECTOR",
  FRONTEND_BUILD: "FRONTEND_BUILDER",
  VISUAL_QA: "VISUAL_QA",
};

export function criticalAgentKey(
  stage: WebsiteFactoryStage,
): string | null {
  return CRITICAL_AGENT_STAGE_MAP[stage] ?? null;
}

