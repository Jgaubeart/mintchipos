import { createClient } from "@/lib/supabase/server";
import type {
  AgentDefinition,
  AgentDefinitionVersion,
  AgentRun,
  AgentRunArtifact,
  Database,
} from "@/lib/supabase/database.types";

export type AgentDefinitionListItem = AgentDefinition & {
  current_version_number: number | null;
};

export type AgentRunListItem = AgentRun & {
  agent_key: string;
  agent_name: string;
  project_name: string;
};

export type AgentRunLineageItem = AgentRunArtifact & {
  artifact_id: string;
  artifact_title: string;
  artifact_type: string;
  version_number: number | null;
};

export async function getAgentDefinitions(): Promise<AgentDefinitionListItem[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("agent_definitions")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const currentVersionIds = rows
    .map((definition) => definition.current_version_id)
    .filter((id): id is string => Boolean(id));

  const versionMap = new Map<string, number>();

  if (currentVersionIds.length > 0) {
    const { data: versions, error: versionsError } = await supabase
      .from("agent_definition_versions")
      .select("id, version")
      .in("id", currentVersionIds);

    if (versionsError) {
      throw new Error(versionsError.message);
    }

    for (const version of versions ?? []) {
      versionMap.set(version.id, version.version);
    }
  }

  return rows.map((definition) => ({
    ...definition,
    current_version_number: definition.current_version_id
      ? (versionMap.get(definition.current_version_id) ?? null)
      : null,
  }));
}

export async function getAgentDefinitionByKey(
  key: string,
): Promise<AgentDefinition | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("agent_definitions")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAgentDefinitionById(
  agentDefinitionId: string,
): Promise<AgentDefinition | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("agent_definitions")
    .select("*")
    .eq("id", agentDefinitionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAgentDefinitionVersions(
  agentDefinitionId: string,
): Promise<AgentDefinitionVersion[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("agent_definition_versions")
    .select("*")
    .eq("agent_definition_id", agentDefinitionId)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAgentDefinitionVersionById(
  agentDefinitionVersionId: string,
): Promise<AgentDefinitionVersion | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("agent_definition_versions")
    .select("*")
    .eq("id", agentDefinitionVersionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAgentRuns(): Promise<AgentRunListItem[]> {
  const supabase = await createClient<Database>();
  const { data: runs, error } = await supabase
    .from("agent_runs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const runRows = runs ?? [];
  const agentIds = [...new Set(runRows.map((run) => run.agent_definition_id))];
  const projectIds = [...new Set(runRows.map((run) => run.project_id))];

  const agentMap = new Map<string, AgentDefinition>();
  const projectMap = new Map<string, { name: string }>();

  if (agentIds.length > 0) {
    const { data: agents, error: agentsError } = await supabase
      .from("agent_definitions")
      .select("*")
      .in("id", agentIds);

    if (agentsError) {
      throw new Error(agentsError.message);
    }

    for (const agent of agents ?? []) {
      agentMap.set(agent.id, agent);
    }
  }

  if (projectIds.length > 0) {
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);

    if (projectsError) {
      throw new Error(projectsError.message);
    }

    for (const project of projects ?? []) {
      projectMap.set(project.id, project);
    }
  }

  return runRows.map((run) => ({
    ...run,
    agent_key: agentMap.get(run.agent_definition_id)?.key ?? "—",
    agent_name: agentMap.get(run.agent_definition_id)?.name ?? "—",
    project_name: projectMap.get(run.project_id)?.name ?? "—",
  }));
}

export async function getAgentRunById(
  runId: string,
): Promise<AgentRun | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAgentRunArtifacts(
  runId: string,
): Promise<AgentRunArtifact[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("agent_run_artifacts")
    .select("*")
    .eq("agent_run_id", runId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAgentRunLineage(
  runId: string,
): Promise<AgentRunLineageItem[]> {
  const supabase = await createClient<Database>();
  const { data: links, error } = await supabase
    .from("agent_run_artifacts")
    .select("*")
    .eq("agent_run_id", runId);

  if (error) {
    throw new Error(error.message);
  }

  const lineageRows = links ?? [];
  const versionIds = [
    ...new Set(lineageRows.map((link) => link.artifact_version_id)),
  ];

  const versionMap = new Map<
    string,
    { artifact_id: string; version: number }
  >();
  const artifactMap = new Map<string, { title: string; artifact_type: string }>();

  if (versionIds.length > 0) {
    const { data: versions, error: versionsError } = await supabase
      .from("artifact_versions")
      .select("id, artifact_id, version")
      .in("id", versionIds);

    if (versionsError) {
      throw new Error(versionsError.message);
    }

    const artifactIds = [
      ...new Set((versions ?? []).map((version) => version.artifact_id)),
    ];

    for (const version of versions ?? []) {
      versionMap.set(version.id, {
        artifact_id: version.artifact_id,
        version: version.version,
      });
    }

    if (artifactIds.length > 0) {
      const { data: artifacts, error: artifactsError } = await supabase
        .from("artifacts")
        .select("id, title, artifact_type")
        .in("id", artifactIds);

      if (artifactsError) {
        throw new Error(artifactsError.message);
      }

      for (const artifact of artifacts ?? []) {
        artifactMap.set(artifact.id, {
          title: artifact.title,
          artifact_type: artifact.artifact_type,
        });
      }
    }
  }

  return lineageRows.map((link) => {
    const version = versionMap.get(link.artifact_version_id);
    const artifact = version
      ? artifactMap.get(version.artifact_id)
      : undefined;

    return {
      ...link,
      artifact_id: version?.artifact_id ?? "",
      artifact_title: artifact?.title ?? "—",
      artifact_type: artifact?.artifact_type ?? "—",
      version_number: version?.version ?? null,
    };
  });
}
