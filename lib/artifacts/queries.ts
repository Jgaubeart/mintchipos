import { createClient } from "@/lib/supabase/server";
import type {
  Artifact,
  ArtifactVersion,
  Database,
} from "@/lib/supabase/database.types";

export type ProjectArtifact = Artifact & {
  current_version_number: number | null;
};

export async function getProjectArtifacts(
  projectId: string,
): Promise<ProjectArtifact[]> {
  const supabase = await createClient<Database>();
  const { data: artifacts, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = artifacts ?? [];
  const currentVersionIds = rows
    .map((artifact) => artifact.current_version_id)
    .filter((id): id is string => Boolean(id));

  const versionMap = new Map<string, number>();

  if (currentVersionIds.length > 0) {
    const { data: versions, error: versionsError } = await supabase
      .from("artifact_versions")
      .select("id, version")
      .in("id", currentVersionIds);

    if (versionsError) {
      throw new Error(versionsError.message);
    }

    for (const version of versions ?? []) {
      versionMap.set(version.id, version.version);
    }
  }

  return rows.map((artifact) => ({
    ...artifact,
    current_version_number: artifact.current_version_id
      ? (versionMap.get(artifact.current_version_id) ?? null)
      : null,
  }));
}

export async function getArtifactById(
  artifactId: string,
): Promise<Artifact | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", artifactId)
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
