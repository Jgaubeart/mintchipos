import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  Deployment,
} from "@/lib/supabase/database.types";

export async function getDeployments(limit = 100): Promise<Deployment[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("deployments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getDeploymentsByProjectId(
  projectId: string,
): Promise<Deployment[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("deployments")
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getDeploymentById(
  id: string,
): Promise<Deployment | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("deployments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentDeployment(
  projectId: string,
  deploymentType: "PREVIEW" | "PRODUCTION",
): Promise<Deployment | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("deployments")
    .select("*")
    .eq("project_id", projectId)
    .eq("deployment_type", deploymentType)
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

