"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { PROJECT_TYPES, type ProjectType } from "@/lib/projects/constants";
import { generateProjectIdentifiers } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { CreateProjectFormState } from "./types";

export async function createProject(
  _previousState: CreateProjectFormState,
  formData: FormData,
): Promise<CreateProjectFormState> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const projectType = String(formData.get("project_type") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const fieldErrors: CreateProjectFormState["fieldErrors"] = {};

  if (!name) {
    fieldErrors.name = "Project name is required.";
  } else if (name.length > 120) {
    fieldErrors.name = "Project name must be 120 characters or fewer.";
  }

  if (!PROJECT_TYPES.includes(projectType as ProjectType)) {
    fieldErrors.project_type = "Select a project type.";
  }

  if (description.length > 1000) {
    fieldErrors.description = "Description must be 1000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const supabase = await createClient<Database>();
  const { projectNumber, slug } = await generateProjectIdentifiers(name);

  const { error } = await supabase.from("projects").insert({
    name,
    slug,
    project_number: projectNumber,
    project_type: projectType as ProjectType,
    description: description || null,
    created_by: user.id,
  });

  if (error) {
    return {
      error: error.message || "Unable to create the project.",
      fieldErrors: {},
    };
  }

  redirect(`/projects/${slug}`);
}
