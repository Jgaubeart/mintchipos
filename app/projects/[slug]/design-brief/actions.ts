"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  DESIGN_BRIEF_ARTIFACT_TYPE,
  DESIGN_BRIEF_TITLE,
} from "@/lib/design-brief/constants";
import { buildDesignBriefSummary } from "@/lib/design-brief/summary";
import type { DesignBrief } from "@/lib/design-brief/types";
import { validateDesignBrief } from "@/lib/design-brief/validate";
import type { SaveBriefFormState } from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveDesignBrief(
  _previousState: SaveBriefFormState,
  formData: FormData,
): Promise<SaveBriefFormState> {
  await requireUser();

  const projectId = String(formData.get("project_id") ?? "").trim();
  const projectSlug = String(formData.get("project_slug") ?? "").trim();
  const briefJson = String(formData.get("brief_json") ?? "").trim();

  if (!UUID_PATTERN.test(projectId) || !projectSlug) {
    return { error: "Invalid project." };
  }

  let brief: unknown;
  try {
    brief = JSON.parse(briefJson);
  } catch {
    return { error: "Unable to read the brief." };
  }

  const validation = validateDesignBrief(brief);
  if (!validation.ok) {
    return { error: validation.errors.join(" ") };
  }

  const content = buildDesignBriefSummary(brief as DesignBrief);
  const supabase = await createClient<Database>();

  const { data: existing, error: findError } = await supabase
    .from("artifacts")
    .select("id")
    .eq("project_id", projectId)
    .eq("artifact_type", DESIGN_BRIEF_ARTIFACT_TYPE)
    .maybeSingle();

  if (findError) {
    return { error: findError.message };
  }

  if (existing) {
    const { error } = await supabase.rpc("add_artifact_version", {
      p_artifact_id: existing.id,
      p_content: content,
      p_structured_data: brief,
    });
    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.rpc("create_artifact", {
      p_project_id: projectId,
      p_artifact_type: DESIGN_BRIEF_ARTIFACT_TYPE,
      p_title: DESIGN_BRIEF_TITLE,
      p_content: content,
      p_structured_data: brief,
    });
    if (error) {
      return { error: error.message };
    }
  }

  redirect(`/projects/${encodeURIComponent(projectSlug)}/design-brief`);
}
