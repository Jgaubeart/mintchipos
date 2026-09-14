"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getAgentDefinitionByKey } from "@/lib/agents/queries";
import { validatePlaybookBrief } from "@/lib/playbooks/brief";
import { getArtifactVersions } from "@/lib/playbooks/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function runPlaybookResearch(formData: FormData): Promise<void> {
  await requireUser();

  const briefArtifactId = String(formData.get("brief_artifact_id") ?? "").trim();
  const projectId = String(formData.get("project_id") ?? "").trim();

  if (!UUID_PATTERN.test(briefArtifactId) || !UUID_PATTERN.test(projectId)) {
    redirect(`/playbooks/${encodeURIComponent(briefArtifactId)}?error=${encodeURIComponent("Invalid playbook brief.")}`);
  }

  const versions = await getArtifactVersions(briefArtifactId);
  const brief = versions[0]?.structured_data;

  if (!validatePlaybookBrief(brief).ok) {
    redirect(`/playbooks/${encodeURIComponent(briefArtifactId)}?error=${encodeURIComponent("Playbook brief is incomplete.")}`);
  }

  const researcher = await getAgentDefinitionByKey("RESEARCH_STRATEGIST");
  if (!researcher) {
    redirect(`/playbooks/${encodeURIComponent(briefArtifactId)}?error=${encodeURIComponent("Research Strategist is unavailable.")}`);
  }

  const supabase = await createClient<Database>();
  const { data, error } = await supabase.rpc("create_agent_run", {
    p_project_id: projectId,
    p_agent_definition_id: researcher.id,
    p_input_snapshot: { kind: "PLAYBOOK_RESEARCH", brief },
  });

  if (error || !data) {
    redirect(`/playbooks/${encodeURIComponent(briefArtifactId)}?error=${encodeURIComponent(error?.message || "Unable to create the research run.")}`);
  }

  redirect(`/runs/${data}`);
}
