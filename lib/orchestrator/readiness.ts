import type { WebsiteFactoryRun } from "@/lib/supabase/database.types";
import { normalizeVisualQaReport } from "../website-factory/qa";

export type ProductionReadiness = {
  productionReady: boolean;
  previewReady: boolean;
  visualQaStatus: "PASSED" | "PASSED_WITH_DEMO_LIMITATIONS" | "FAILED";
  blockingDefects: string[];
  demoLimitations: string[];
  functionalQaPassed: boolean | null;
  previewUrl: string | null;
  failureReason: string | null;
};

function stageOutput(
  run: WebsiteFactoryRun | null,
  stageName: string,
): unknown {
  const stage = (run?.stages ?? []).find(
    (item) => item.stage === stageName,
  );
  return stage?.output ?? null;
}

export function resolveProductionReadiness(
  run: WebsiteFactoryRun | null,
): ProductionReadiness {
  const visual = normalizeVisualQaReport(
    stageOutput(run, "VISUAL_QA"),
  );
  const functionalOutput = stageOutput(run, "FUNCTIONAL_QA") as {
    passed?: boolean;
  } | null;
  const previewUrl = run?.preview_url ?? null;
  const failureReason = run?.failure_reason ?? null;

  return {
    productionReady:
      Boolean(run) &&
      visual.status !== "FAILED" &&
      visual.demoLimitations.length === 0 &&
      Boolean(previewUrl) &&
      !failureReason,
    previewReady: Boolean(previewUrl),
    visualQaStatus: visual.status,
    blockingDefects: visual.blockingDefects,
    demoLimitations: visual.demoLimitations,
    functionalQaPassed: functionalOutput?.passed ?? null,
    previewUrl,
    failureReason,
  };
}
