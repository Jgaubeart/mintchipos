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

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "project";
}

export async function getNextProjectNumber(): Promise<string> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase.rpc("next_mintchip_project_number");

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Unable to allocate a project number.");
  }

  return data;
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("projects")
    .select("slug");

  if (error) {
    throw new Error(error.message);
  }

  const slugs = new Set((data ?? []).map((row) => row.slug));
  const baseSlug = slugify(name);

  let slug = baseSlug;
  let suffix = 2;
  while (slugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}
