"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import {
  TOOL_PERMISSION_LEVELS,
  type ToolPermissionLevel,
} from "@/lib/capabilities/constants";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function redirectWithError(agentKey: string, message: string): never {
  redirect(`/agents/${encodeURIComponent(agentKey)}?error=${encodeURIComponent(message)}`);
}

function getAgentKey(formData: FormData): string {
  return String(formData.get("agent_key") ?? "").trim();
}

export async function assignSkill(formData: FormData): Promise<void> {
  await requireUser();

  const agentKey = getAgentKey(formData);
  const agentDefinitionId = String(
    formData.get("agent_definition_id") ?? "",
  ).trim();
  const skillId = String(formData.get("skill_id") ?? "").trim();

  if (!UUID_PATTERN.test(agentDefinitionId) || !UUID_PATTERN.test(skillId)) {
    redirectWithError(agentKey, "Invalid skill assignment.");
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("assign_skill_to_agent", {
    p_agent_definition_id: agentDefinitionId,
    p_skill_id: skillId,
    p_required: false,
    p_enabled: true,
  });

  if (error) {
    redirectWithError(agentKey, error.message);
  }

  redirect(`/agents/${encodeURIComponent(agentKey)}`);
}

export async function disableSkillAssignment(formData: FormData): Promise<void> {
  await requireUser();

  const agentKey = getAgentKey(formData);
  const assignmentId = String(formData.get("assignment_id") ?? "").trim();

  if (!UUID_PATTERN.test(assignmentId)) {
    redirectWithError(agentKey, "Invalid skill assignment.");
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("set_agent_skill_enabled", {
    p_agent_skill_id: assignmentId,
    p_enabled: false,
  });

  if (error) {
    redirectWithError(agentKey, error.message);
  }

  redirect(`/agents/${encodeURIComponent(agentKey)}`);
}

export async function enableSkillAssignment(formData: FormData): Promise<void> {
  await requireUser();

  const agentKey = getAgentKey(formData);
  const assignmentId = String(formData.get("assignment_id") ?? "").trim();

  if (!UUID_PATTERN.test(assignmentId)) {
    redirectWithError(agentKey, "Invalid skill assignment.");
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("set_agent_skill_enabled", {
    p_agent_skill_id: assignmentId,
    p_enabled: true,
  });

  if (error) {
    redirectWithError(agentKey, error.message);
  }

  redirect(`/agents/${encodeURIComponent(agentKey)}`);
}

export async function removeSkillAssignment(formData: FormData): Promise<void> {
  await requireUser();

  const agentKey = getAgentKey(formData);
  const assignmentId = String(formData.get("assignment_id") ?? "").trim();

  if (!UUID_PATTERN.test(assignmentId)) {
    redirectWithError(agentKey, "Invalid skill assignment.");
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("remove_agent_skill", {
    p_agent_skill_id: assignmentId,
  });

  if (error) {
    redirectWithError(agentKey, error.message);
  }

  redirect(`/agents/${encodeURIComponent(agentKey)}`);
}

export async function assignTool(formData: FormData): Promise<void> {
  await requireUser();

  const agentKey = getAgentKey(formData);
  const agentDefinitionId = String(
    formData.get("agent_definition_id") ?? "",
  ).trim();
  const toolId = String(formData.get("tool_id") ?? "").trim();
  const permissionLevel = String(
    formData.get("permission_level") ?? "",
  ).trim();

  if (
    !UUID_PATTERN.test(agentDefinitionId) ||
    !UUID_PATTERN.test(toolId) ||
    !TOOL_PERMISSION_LEVELS.includes(permissionLevel as ToolPermissionLevel)
  ) {
    redirectWithError(agentKey, "Invalid tool assignment.");
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("assign_tool_to_agent", {
    p_agent_definition_id: agentDefinitionId,
    p_tool_id: toolId,
    p_permission_level: permissionLevel as ToolPermissionLevel,
    p_enabled: true,
  });

  if (error) {
    redirectWithError(agentKey, error.message);
  }

  redirect(`/agents/${encodeURIComponent(agentKey)}`);
}

export async function disableToolAssignment(formData: FormData): Promise<void> {
  await requireUser();

  const agentKey = getAgentKey(formData);
  const assignmentId = String(formData.get("assignment_id") ?? "").trim();

  if (!UUID_PATTERN.test(assignmentId)) {
    redirectWithError(agentKey, "Invalid tool assignment.");
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("set_agent_tool_enabled", {
    p_agent_tool_id: assignmentId,
    p_enabled: false,
  });

  if (error) {
    redirectWithError(agentKey, error.message);
  }

  redirect(`/agents/${encodeURIComponent(agentKey)}`);
}

export async function enableToolAssignment(formData: FormData): Promise<void> {
  await requireUser();

  const agentKey = getAgentKey(formData);
  const assignmentId = String(formData.get("assignment_id") ?? "").trim();

  if (!UUID_PATTERN.test(assignmentId)) {
    redirectWithError(agentKey, "Invalid tool assignment.");
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("set_agent_tool_enabled", {
    p_agent_tool_id: assignmentId,
    p_enabled: true,
  });

  if (error) {
    redirectWithError(agentKey, error.message);
  }

  redirect(`/agents/${encodeURIComponent(agentKey)}`);
}

export async function removeToolAssignment(formData: FormData): Promise<void> {
  await requireUser();

  const agentKey = getAgentKey(formData);
  const assignmentId = String(formData.get("assignment_id") ?? "").trim();

  if (!UUID_PATTERN.test(assignmentId)) {
    redirectWithError(agentKey, "Invalid tool assignment.");
  }

  const supabase = await createClient<Database>();
  const { error } = await supabase.rpc("remove_agent_tool", {
    p_agent_tool_id: assignmentId,
  });

  if (error) {
    redirectWithError(agentKey, error.message);
  }

  redirect(`/agents/${encodeURIComponent(agentKey)}`);
}
