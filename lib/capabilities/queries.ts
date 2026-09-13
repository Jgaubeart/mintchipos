import { createClient } from "@/lib/supabase/server";
import type {
  AgentSkill,
  AgentTool,
  Database,
  Skill,
  SkillVersion,
  Tool,
} from "@/lib/supabase/database.types";
import type { SkillSourceType, ToolRiskLevel } from "./constants";

export type SkillListItem = Skill & {
  current_version_number: number | null;
  source_type: SkillSourceType | null;
};

export type AgentSkillListItem = AgentSkill & {
  skill_key: string;
  skill_name: string;
  current_version_number: number | null;
};

export type AgentToolListItem = AgentTool & {
  tool_key: string;
  tool_name: string;
  risk_level: ToolRiskLevel;
};

export async function getSkills(): Promise<SkillListItem[]> {
  const supabase = await createClient<Database>();
  const { data: skills, error } = await supabase
    .from("skills")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = skills ?? [];
  const currentVersionIds = rows
    .map((skill) => skill.current_version_id)
    .filter((id): id is string => Boolean(id));

  const versionMap = new Map<
    string,
    { version: number; source_type: SkillSourceType | null }
  >();

  if (currentVersionIds.length > 0) {
    const { data: versions, error: versionsError } = await supabase
      .from("skill_versions")
      .select("id, version, source_type")
      .in("id", currentVersionIds);

    if (versionsError) {
      throw new Error(versionsError.message);
    }

    for (const version of versions ?? []) {
      versionMap.set(version.id, {
        version: version.version,
        source_type: version.source_type,
      });
    }
  }

  return rows.map((skill) => ({
    ...skill,
    current_version_number: skill.current_version_id
      ? (versionMap.get(skill.current_version_id)?.version ?? null)
      : null,
    source_type: skill.current_version_id
      ? (versionMap.get(skill.current_version_id)?.source_type ?? null)
      : null,
  }));
}

export async function getSkillByKey(key: string): Promise<Skill | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSkillById(skillId: string): Promise<Skill | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("id", skillId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSkillVersions(
  skillId: string,
): Promise<SkillVersion[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("skill_versions")
    .select("*")
    .eq("skill_id", skillId)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getTools(): Promise<Tool[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getToolByKey(key: string): Promise<Tool | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getToolById(toolId: string): Promise<Tool | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("id", toolId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAgentSkillAssignments(
  agentDefinitionId: string,
): Promise<AgentSkillListItem[]> {
  const supabase = await createClient<Database>();
  const { data: assignments, error } = await supabase
    .from("agent_skills")
    .select("*")
    .eq("agent_definition_id", agentDefinitionId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = assignments ?? [];
  const skillIds = [...new Set(rows.map((assignment) => assignment.skill_id))];
  const skillMap = new Map<string, Skill>();

  if (skillIds.length > 0) {
    const { data: skills, error: skillsError } = await supabase
      .from("skills")
      .select("*")
      .in("id", skillIds);

    if (skillsError) {
      throw new Error(skillsError.message);
    }

    for (const skill of skills ?? []) {
      skillMap.set(skill.id, skill);
    }
  }

  const currentVersionIds = [...skillMap.values()]
    .map((skill) => skill.current_version_id)
    .filter((id): id is string => Boolean(id));
  const versionMap = new Map<string, number>();

  if (currentVersionIds.length > 0) {
    const { data: versions, error: versionsError } = await supabase
      .from("skill_versions")
      .select("id, version")
      .in("id", currentVersionIds);

    if (versionsError) {
      throw new Error(versionsError.message);
    }

    for (const version of versions ?? []) {
      versionMap.set(version.id, version.version);
    }
  }

  return rows.map((assignment) => {
    const skill = skillMap.get(assignment.skill_id);

    return {
      ...assignment,
      skill_key: skill?.key ?? "—",
      skill_name: skill?.name ?? "—",
      current_version_number: skill?.current_version_id
        ? (versionMap.get(skill.current_version_id) ?? null)
        : null,
    };
  });
}

export async function getAgentToolAssignments(
  agentDefinitionId: string,
): Promise<AgentToolListItem[]> {
  const supabase = await createClient<Database>();
  const { data: assignments, error } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("agent_definition_id", agentDefinitionId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = assignments ?? [];
  const toolIds = [...new Set(rows.map((assignment) => assignment.tool_id))];
  const toolMap = new Map<string, Tool>();

  if (toolIds.length > 0) {
    const { data: tools, error: toolsError } = await supabase
      .from("tools")
      .select("*")
      .in("id", toolIds);

    if (toolsError) {
      throw new Error(toolsError.message);
    }

    for (const tool of tools ?? []) {
      toolMap.set(tool.id, tool);
    }
  }

  return rows.map((assignment) => {
    const tool = toolMap.get(assignment.tool_id);

    return {
      ...assignment,
      tool_key: tool?.key ?? "—",
      tool_name: tool?.name ?? "—",
      risk_level: tool?.risk_level ?? "LOW",
    };
  });
}
