import { generatePreviewSlug } from "../demo-staging/naming";
import { getDemoDeploymentProvider } from "../demo-staging/provider";
import {
  MAX_REPAIR_CYCLES,
  WEBSITE_FACTORY_STAGES,
  type WebsiteFactoryStage,
  type WebsiteFactoryStageStatus,
} from "./constants";
import { criticalAgentKey } from "./agent-schemas";
import { classifyIndustry } from "./classify";
import { buildAutoDesignBrief } from "./brief";
import { buildFrontendBuildSpec } from "./build-spec";
import { DeterministicFrontendBuilder } from "./builder";
import { FixturePlaybookProvider } from "./playbook";
import {
  normalizeVisualQaReport,
  runFunctionalQa,
  runVisualQa,
} from "./qa";
import { getDefaultResearchProvider } from "./research";
import {
  buildAssetAudit,
  buildAssetPlan,
  buildCreativeDirection,
  buildUxContentStrategy,
} from "./strategy";
import type {
  AutoDesignBriefResult,
  CreativeDirection,
  FrontendBuildResult,
  PreviewDeploymentResult,
  UxContentStrategy,
  VisualQaReport,
  WebsiteFactoryArtifact,
  WebsiteFactoryInput,
  WebsiteFactoryRun,
  WebsiteFactoryServices,
  WebsiteFactoryStageResult,
} from "./types";
import { validateDesignBrief } from "../design-brief/validate";

function makeId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ?? `website-factory-${Date.now()}`;
}

function initialStage(
  stage: WebsiteFactoryStage,
): WebsiteFactoryStageResult {
  return {
    stage,
    status: "NOT_STARTED",
    startedAt: null,
    completedAt: null,
    output: null,
    artifact: null,
    defectCount: 0,
    message: null,
  };
}

function stageArtifact(
  stage: WebsiteFactoryStage,
  artifactType: string,
): WebsiteFactoryArtifact {
  return {
    stage,
    artifactType,
    artifactVersionId: null,
  };
}

export async function runWebsiteFactoryPipeline(
  input: WebsiteFactoryInput,
  services: WebsiteFactoryServices = {},
): Promise<WebsiteFactoryRun> {
  const now = services.now ?? (() => new Date().toISOString());
  const researchProvider =
    services.researchProvider ?? getDefaultResearchProvider();
  const playbookProvider =
    services.playbookProvider ?? new FixturePlaybookProvider();
  const frontendBuilder =
    services.frontendBuilder ?? new DeterministicFrontendBuilder();
  const agentRuntime = services.agentRuntime ?? null;
  const deploymentProvider =
    services.deploymentProvider ?? getDemoDeploymentProvider();

  const stages: WebsiteFactoryStageResult[] = WEBSITE_FACTORY_STAGES.map(
    initialStage,
  );
  const stageMap = new Map(
    stages.map((stage) => [stage.stage, stage]),
  );

  const updateStage = (
    stage: WebsiteFactoryStage,
    status: WebsiteFactoryStageStatus,
    output: unknown,
    options: {
      artifact?: WebsiteFactoryArtifact | null;
      defectCount?: number;
      message?: string | null;
      completedAt?: string;
    } = {},
  ) => {
    const record = stageMap.get(stage);
    if (!record) {
      throw new Error(`Unknown website factory stage: ${stage}`);
    }
    record.status = status;
    record.output = output;
    record.completedAt = options.completedAt ?? now();
    record.artifact = options.artifact ?? null;
    record.defectCount = options.defectCount ?? 0;
    record.message = options.message ?? null;
  };

  const run: WebsiteFactoryRun = {
    id: makeId(),
    projectId: input.projectId,
    websiteUrl: input.websiteUrl,
    businessName: input.businessName?.trim() || null,
    status: "RUNNING",
    currentStage: "BUSINESS_RESEARCH",
    progress: 0,
    stages,
    artifacts: [],
    previewUrl: null,
    previewHostname: null,
    buildId: null,
    providerDeploymentId: null,
    failureReason: null,
    createdAt: now(),
    updatedAt: now(),
  };

  const completeStage = (
    stage: WebsiteFactoryStage,
    output: unknown,
    artifactType?: string,
  ) => {
    updateStage(stage, "COMPLETED", output, {
      artifact: artifactType ? stageArtifact(stage, artifactType) : null,
    });
    run.currentStage = stage;
    run.progress = Math.round(
      (stages.filter((item) => item.status === "COMPLETED").length /
        WEBSITE_FACTORY_STAGES.length) *
        100,
    );
  };

  try {
    const research = await researchProvider.research(input);
    run.businessName = run.businessName ?? research.businessName;
    completeStage("BUSINESS_RESEARCH", research, "BUSINESS_RESEARCH");

    const classification = classifyIndustry(
      research,
      input.existingBrief?.project.industry ?? null,
    );
    completeStage(
      "INDUSTRY_CLASSIFICATION",
      classification,
      "INDUSTRY_CLASSIFICATION",
    );

    const playbookSelection = await playbookProvider.select(classification);
    completeStage(
      "PLAYBOOK_SELECTION",
      playbookSelection,
      "INDUSTRY_PLAYBOOK",
    );

    const project = {
      id: input.projectId,
      slug: "website-factory",
      name: run.businessName ?? "Mint Chip Website",
      project_number: null,
      project_type: null,
      lifecycle_status: null,
      production_stage: null,
      description: research.description,
    };
    let briefResult: AutoDesignBriefResult;
    if (agentRuntime) {
      const runtimeOutput = await agentRuntime.executeStage({
        stage: "DESIGN_BRIEF",
        agentKey: criticalAgentKey("DESIGN_BRIEF") ?? "ORCHESTRATOR",
        projectId: input.projectId,
        stageInput: {
          businessResearch: research,
          industryClassification: classification,
          industryPlaybook: playbookSelection.playbook,
          existingBrief: input.existingBrief ?? null,
          precedence: [
            "SYSTEM_OR_MINT_CHIP_BUSINESS_RULES",
            "PROJECT_DESIGN_DIRECTION_BRIEF",
            "INDUSTRY_PLAYBOOK",
            "AGENT_CREATIVE_JUDGMENT",
          ],
        },
      });
      briefResult = runtimeOutput.output as AutoDesignBriefResult;
      const validation = validateDesignBrief(briefResult.brief);
      if (!validation.ok) {
        throw new Error(
          `Design Brief agent output failed validation: ${validation.errors.join(" ")}`,
        );
      }
    } else {
      briefResult = input.existingBrief
        ? {
            brief: input.existingBrief,
            precedence: [
              "SYSTEM_OR_MINT_CHIP_BUSINESS_RULES",
              "PROJECT_DESIGN_DIRECTION_BRIEF",
              "INDUSTRY_PLAYBOOK",
              "AGENT_CREATIVE_JUDGMENT",
            ],
            lineage: {
              businessResearch: true,
              industryPlaybook: true,
              systemRules: true,
            },
          }
        : buildAutoDesignBrief({
            project,
            research,
            classification,
            playbook: playbookSelection.playbook,
          });
    }
    completeStage("DESIGN_BRIEF", briefResult, "DESIGN_DIRECTION_BRIEF");

    let uxContent: UxContentStrategy;
    if (agentRuntime) {
      const runtimeOutput = await agentRuntime.executeStage({
        stage: "UX_CONTENT_STRATEGY",
        agentKey: criticalAgentKey("UX_CONTENT_STRATEGY") ?? "UX_CONTENT_STRATEGIST",
        projectId: input.projectId,
        stageInput: {
          businessResearch: research,
          industryPlaybook: playbookSelection.playbook,
          designBrief: briefResult.brief,
        },
      });
      uxContent = runtimeOutput.output as UxContentStrategy;
    } else {
      uxContent = buildUxContentStrategy({
        brief: briefResult.brief,
        research,
      });
    }
    completeStage("UX_CONTENT_STRATEGY", uxContent, "UX_CONTENT_STRATEGY");

    const assetAudit = buildAssetAudit(research);
    completeStage("ASSET_AUDIT", assetAudit, "ASSET_AUDIT");

    let creative: CreativeDirection;
    if (agentRuntime) {
      const runtimeOutput = await agentRuntime.executeStage({
        stage: "CREATIVE_DIRECTION",
        agentKey: criticalAgentKey("CREATIVE_DIRECTION") ?? "CREATIVE_DIRECTOR",
        projectId: input.projectId,
        stageInput: {
          businessResearch: research,
          industryPlaybook: playbookSelection.playbook,
          designBrief: briefResult.brief,
          uxContentStrategy: uxContent,
          assetAudit,
        },
      });
      creative = runtimeOutput.output as CreativeDirection;
    } else {
      creative = buildCreativeDirection({
        brief: briefResult.brief,
        research,
        strategy: uxContent,
      });
    }
    completeStage("CREATIVE_DIRECTION", creative, "CREATIVE_DIRECTION");

    const assetPlan = buildAssetPlan({
      creative,
      audit: assetAudit,
    });
    completeStage("ASSET_PLAN", assetPlan, "ASSET_PLAN");

    const frontendSpec = buildFrontendBuildSpec({
      brief: briefResult.brief,
      research,
      strategy: uxContent,
      creative,
      assets: assetPlan,
    });

    let build: FrontendBuildResult;
    if (agentRuntime) {
      const runtimeOutput = await agentRuntime.executeStage({
        stage: "FRONTEND_BUILD",
        agentKey: criticalAgentKey("FRONTEND_BUILD") ?? "FRONTEND_BUILDER",
        projectId: input.projectId,
        stageInput: frontendSpec,
      });
      build = runtimeOutput.output as FrontendBuildResult;
    } else {
      build = await frontendBuilder.build({
        brief: briefResult.brief,
        research,
        strategy: uxContent,
        creative,
        assets: assetPlan,
      });
    }
    run.buildId = build.buildId;
    completeStage("FRONTEND_BUILD", build, "WEBSITE_SOURCE");

    let repairCycles = 0;
    let functional = runFunctionalQa(build.html);
    let visual: VisualQaReport;
    if (agentRuntime) {
      const runtimeOutput = await agentRuntime.executeStage({
        stage: "VISUAL_QA",
        agentKey: criticalAgentKey("VISUAL_QA") ?? "VISUAL_QA",
        projectId: input.projectId,
        stageInput: {
          html: build.html,
          designBrief: briefResult.brief,
          creativeDirection: creative,
          industryPlaybook: playbookSelection.playbook,
          functionalQa: functional,
        },
      });
      visual = normalizeVisualQaReport(runtimeOutput.output);
    } else {
      visual = runVisualQa(build.html);
    }
    const defects = [...functional.defects, ...visual.blockingDefects];

    while (defects.length > 0 && repairCycles < MAX_REPAIR_CYCLES) {
      repairCycles += 1;
      build = agentRuntime
        ? (
            await agentRuntime.executeStage({
              stage: "FRONTEND_BUILD",
              agentKey: criticalAgentKey("FRONTEND_BUILD") ?? "FRONTEND_BUILDER",
              projectId: input.projectId,
              stageInput: { ...frontendSpec, defects },
            })
          ).output as FrontendBuildResult
        : await frontendBuilder.build({
            brief: briefResult.brief,
            research,
            strategy: uxContent,
            creative,
            assets: assetPlan,
            defects,
          });
      run.buildId = build.buildId;
      functional = runFunctionalQa(build.html);
      const visualCandidate = agentRuntime
        ? (
            await agentRuntime.executeStage({
              stage: "VISUAL_QA",
              agentKey: criticalAgentKey("VISUAL_QA") ?? "VISUAL_QA",
              projectId: input.projectId,
              stageInput: {
                html: build.html,
                designBrief: briefResult.brief,
                creativeDirection: creative,
                industryPlaybook: playbookSelection.playbook,
                functionalQa: functional,
                repairCycle: repairCycles,
              },
            })
          ).output
        : runVisualQa(build.html);
      visual = normalizeVisualQaReport(visualCandidate);
      defects.splice(
        0,
        defects.length,
        ...functional.defects,
        ...visual.blockingDefects,
      );
    }

    updateStage("FRONTEND_BUILD", "COMPLETED", build, {
      artifact: stageArtifact("FRONTEND_BUILD", "WEBSITE_SOURCE"),
      defectCount: repairCycles,
    });
    completeStage(
      "FUNCTIONAL_QA",
      functional,
      "FUNCTIONAL_QA_REPORT",
    );
    completeStage("VISUAL_QA", visual, "VISUAL_QA_REPORT");

    if (
      visual.status === "FAILED" &&
      !(services.allowPreviewWhenFailed ?? false)
    ) {
      updateStage("PREVIEW_DEPLOYMENT", "BLOCKED", null, {
        message:
          "Preview blocked because Visual QA failed and no internal override is present.",
      });
      run.status = "READY_FOR_LIVE_VERIFICATION";
      run.failureReason = visual.blockingDefects.join("; ");
      run.artifacts = stages
        .map((stage) => stage.artifact)
        .filter((artifact): artifact is WebsiteFactoryArtifact =>
          Boolean(artifact),
        );
      run.updatedAt = now();
      return run;
    }

    const preview = generatePreviewSlug({
      businessName: run.businessName ?? "mint-chip-website",
      projectId: input.projectId,
      prospectId: null,
      version: 1,
    });

    let deploymentResult: PreviewDeploymentResult;
    try {
      const created = await deploymentProvider.createPreview({
        projectId: input.projectId,
        prospectId: null,
        deploymentType: "PREVIEW",
        previewSlug: preview,
        previewVisibility: "UNLISTED",
        sourceCommit: null,
        buildId: build.buildId,
        metadata: {
          websiteFactoryRunId: run.id,
          businessName: run.businessName,
        },
      });
      deploymentResult = {
        providerDeploymentId: created.providerDeploymentId,
        previewUrl: created.previewUrl ?? preview.previewUrl,
        previewHostname: preview.hostname,
        status:
          created.status === "READY"
            ? "READY"
            : created.status === "FAILED"
              ? "FAILED"
              : "PENDING",
      };
      run.previewUrl = deploymentResult.previewUrl;
      run.previewHostname = deploymentResult.previewHostname;
      run.providerDeploymentId = deploymentResult.providerDeploymentId;
      completeStage("PREVIEW_DEPLOYMENT", deploymentResult, "DEPLOYMENT");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Preview deployment failed.";
      updateStage("PREVIEW_DEPLOYMENT", "BLOCKED", null, {
        message,
      });
      run.status = "READY_FOR_LIVE_VERIFICATION";
      run.failureReason = message;
    }

    if (run.status !== "READY_FOR_LIVE_VERIFICATION") {
      run.status = "COMPLETED";
    }
    run.artifacts = stages
      .map((stage) => stage.artifact)
      .filter((artifact): artifact is WebsiteFactoryArtifact => Boolean(artifact));
    run.updatedAt = now();

    return run;
  } catch (error) {
    run.status = "FAILED";
    run.failureReason =
      error instanceof Error ? error.message : "Website factory failed.";
    run.updatedAt = now();
    return run;
  }
}
