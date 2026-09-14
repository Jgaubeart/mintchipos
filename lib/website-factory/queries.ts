import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  DeploymentRow,
  WebsiteFactoryRun,
  WebsiteFactoryRunRow,
} from "@/lib/supabase/database.types";
import type { WebsiteFactoryRun as FactoryRun } from "./types";

function runToRow(
  run: FactoryRun,
  userId: string | null,
): Partial<WebsiteFactoryRunRow> {
  return {
    project_id: run.projectId,
    website_url: run.websiteUrl,
    business_name: run.businessName,
    status: run.status,
    current_stage: run.currentStage,
    progress: run.progress,
    stages: run.stages,
    artifacts: run.artifacts,
    preview_url: run.previewUrl,
    provider_deployment_id: run.providerDeploymentId,
    failure_reason: run.failureReason,
    created_by: userId,
    created_at: run.createdAt,
    updated_at: run.updatedAt,
  };
}

export async function getWebsiteFactoryRuns(
  projectId?: string,
  limit = 50,
): Promise<WebsiteFactoryRun[]> {
  const supabase = await createClient<Database>();
  let query = supabase
    .from("website_factory_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getWebsiteFactoryRunById(
  id: string,
): Promise<WebsiteFactoryRun | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("website_factory_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function persistWebsiteFactoryRun(
  run: FactoryRun,
  userId: string,
): Promise<void> {
  const supabase = await createClient<Database>();
  const { error } = await supabase
    .from("website_factory_runs")
    .upsert(runToRow(run, userId), { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function persistFactoryPreviewDeployment(
  run: FactoryRun,
  userId: string,
): Promise<void> {
  if (!run.previewUrl || !run.providerDeploymentId) {
    return;
  }

  const supabase = await createClient<Database>();
  const row: Partial<DeploymentRow> = {
    project_id: run.projectId,
    prospect_id: null,
    deployment_type: "PREVIEW",
    status: "READY",
    provider: "MOCK",
    provider_deployment_id: run.providerDeploymentId,
    preview_url: run.previewUrl,
    preview_hostname: run.previewHostname,
    preview_visibility: "UNLISTED",
    source_artifact_id: null,
    source_artifact_type: null,
    source_commit: null,
    build_id: run.buildId,
    version: 1,
    metadata: {
      websiteFactoryRunId: run.id,
    },
    is_current: false,
    failure_reason: null,
    created_by: userId,
    deployed_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("deployments").insert(row);
  if (error) {
    throw new Error(error.message);
  }
}
