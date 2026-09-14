import { createClient } from "@/lib/supabase/server";
import type {
  Artifact,
  ArtifactVersion,
  Database,
} from "@/lib/supabase/database.types";
import { DESIGN_BRIEF_ARTIFACT_TYPE } from "./constants";

export async function getDesignBriefArtifact(
  projectId: string,
): Promise<Artifact | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .eq("artifact_type", DESIGN_BRIEF_ARTIFACT_TYPE)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getDesignBriefVersions(
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
