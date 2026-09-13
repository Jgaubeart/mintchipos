"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { ARTIFACT_TYPES, type ArtifactType } from "@/lib/artifacts/constants";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { CreateArtifactFormState } from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createArtifact(
  _previousState: CreateArtifactFormState,
  formData: FormData,
): Promise<CreateArtifactFormState> {
  await requireUser();

  const projectId = String(formData.get("project_id") ?? "").trim();
  const projectSlug = String(formData.get("project_slug") ?? "").trim();
  const artifactType = String(formData.get("artifact_type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  const fieldErrors: CreateArtifactFormState["fieldErrors"] = {};

  if (!projectSlug) {
    return {
      error: "Invalid project.",
      fieldErrors: {},
    };
  }

  if (!UUID_PATTERN.test(projectId)) {
    return {
      error: "Invalid project.",
      fieldErrors: {},
    };
  }

  if (!ARTIFACT_TYPES.includes(artifactType as ArtifactType)) {
    fieldErrors.artifact_type = "Select an artifact type.";
  }

  if (!title) {
    fieldErrors.title = "Title is required.";
  } else if (title.length > 160) {
    fieldErrors.title = "Title must be 160 characters or fewer.";
  }

  if (!content) {
    fieldErrors.content = "Initial content is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const supabase = await createClient<Database>();
  const { data, error } = await supabase.rpc("create_artifact", {
    p_project_id: projectId,
    p_artifact_type: artifactType as ArtifactType,
    p_title: title,
    p_content: content,
  });

  if (error || !data) {
    return {
      error: error?.message || "Unable to create the artifact.",
      fieldErrors: {},
    };
  }

  redirect(`/projects/${projectSlug}`);
}
