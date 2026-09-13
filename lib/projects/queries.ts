import { createClient } from "@/lib/supabase/server";
import type { Database, Project } from "@/lib/supabase/database.types";

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
