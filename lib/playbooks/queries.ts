import { createClient } from "@/lib/supabase/server";
import type {
  Artifact,
  ArtifactVersion,
  Database,
} from "@/lib/supabase/database.types";
import {
  INDUSTRY_PLAYBOOK_ARTIFACT_TYPE,
  PLAYBOOK_BRIEF_ARTIFACT_TYPE,
} from "./constants";

export type PlaybookBriefListItem = Artifact & {
  project_name: string;
  project_slug: string;
};

export async function listPlaybookBriefs(): Promise<PlaybookBriefListItem[]> {
  const supabase = await createClient<Database>();
  const { data: briefs, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("artifact_type", PLAYBOOK_BRIEF_ARTIFACT_TYPE)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = briefs ?? [];
  const projectIds = [...new Set(rows.map((row) => row.project_id))];
  const projectMap = new Map<string, { name: string; slug: string }>();

  if (projectIds.length > 0) {
    const { data: projects, error: projectError } = await supabase
      .from("projects")
      .select("id, name, slug")
      .in("id", projectIds);

    if (projectError) {
      throw new Error(projectError.message);
    }

    for (const project of projects ?? []) {
      projectMap.set(project.id, project);
    }
  }

  return rows.map((row) => ({
    ...row,
    project_name: projectMap.get(row.project_id)?.name ?? "—",
    project_slug: projectMap.get(row.project_id)?.slug ?? "",
  }));
}

export async function getPlaybookBriefArtifact(
  projectId: string,
): Promise<Artifact | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .eq("artifact_type", PLAYBOOK_BRIEF_ARTIFACT_TYPE)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getIndustryPlaybookArtifact(
  projectId: string,
): Promise<Artifact | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .eq("artifact_type", INDUSTRY_PLAYBOOK_ARTIFACT_TYPE)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getArtifactVersions(
  artifactId: string,
): Promise<ArtifactVersion[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("artifact_versions")
    .select("*")
    .eq("artifact_id", artifactId)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
