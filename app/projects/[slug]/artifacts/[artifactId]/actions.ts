"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { AddArtifactVersionFormState } from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function addArtifactVersion(
  _previousState: AddArtifactVersionFormState,
  formData: FormData,
): Promise<AddArtifactVersionFormState> {
  await requireUser();

  const projectSlug = String(formData.get("project_slug") ?? "").trim();
  const artifactId = String(formData.get("artifact_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!projectSlug) {
    return { error: "Invalid project.", fieldErrors: {} };
  }

  if (!UUID_PATTERN.test(artifactId)) {
    return { error: "Invalid artifact.", fieldErrors: {} };
  }

  if (!content) {
    return {
      error: null,
      fieldErrors: { content: "Version content is required." },
    };
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("add_artifact_version", {
    p_artifact_id: artifactId,
    p_content: content,
  });

  if (error) {
    return {
      error: error.message || "Unable to add the version.",
      fieldErrors: {},
    };
  }

  redirect(`/projects/${projectSlug}/artifacts/${artifactId}`);
}
