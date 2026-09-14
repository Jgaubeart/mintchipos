"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { PLAYBOOK_BRIEF_ARTIFACT_TYPE } from "@/lib/playbooks/constants";
import { createEmptyPlaybookBrief } from "@/lib/playbooks/brief";
import { validatePlaybookBrief } from "@/lib/playbooks/brief";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CreatePlaybookBriefState = {
  error: string | null;
  fieldErrors: {
    project_id?: string;
    industry_name?: string;
  };
};

export const initialCreatePlaybookBriefState: CreatePlaybookBriefState = {
  error: null,
  fieldErrors: {},
};

export async function createPlaybookBrief(
  _previousState: CreatePlaybookBriefState,
  formData: FormData,
): Promise<CreatePlaybookBriefState> {
  await requireUser();

  const projectId = String(formData.get("project_id") ?? "").trim();
  const industryName = String(formData.get("industry_name") ?? "").trim();
  const industrySubtype = String(formData.get("industry_subtype") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const fieldErrors: CreatePlaybookBriefState["fieldErrors"] = {};
  if (!UUID_PATTERN.test(projectId)) {
    fieldErrors.project_id = "Select a project.";
  }
  if (!industryName) {
    fieldErrors.industry_name = "Industry name is required.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const brief = createEmptyPlaybookBrief({
    industry: {
      industryName,
      industrySubtype,
      typicalBusinessSize: "",
      geographicFocus: "",
      notes,
    },
  });

  const validation = validatePlaybookBrief(brief);
  if (!validation.ok) {
    return { error: validation.errors.join(" "), fieldErrors: {} };
  }

  const supabase = await createClient<Database>();
  const { data, error } = await supabase.rpc("create_artifact", {
    p_project_id: projectId,
    p_artifact_type: PLAYBOOK_BRIEF_ARTIFACT_TYPE,
    p_title: `${industryName} Playbook Brief`,
    p_content: `${industryName}${industrySubtype ? ` — ${industrySubtype}` : ""}`,
    p_structured_data: brief,
  });

  if (error || !data) {
    return {
      error: error?.message || "Unable to create the playbook brief.",
      fieldErrors: {},
    };
  }

  redirect(`/playbooks/${data}`);
}
