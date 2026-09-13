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

export async function generateProjectIdentifiers(name: string): Promise<{
  projectNumber: string;
  slug: string;
}> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("projects")
    .select("project_number, slug");

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const slugs = new Set<string>();
  let highestNumber = 0;

  for (const row of rows) {
    if (row.slug) {
      slugs.add(row.slug);
    }

    const match = row.project_number?.match(/^MC-(\d+)$/);
    if (match) {
      highestNumber = Math.max(highestNumber, Number(match[1]));
    }
  }

  const projectNumber = `MC-${String(highestNumber + 1).padStart(4, "0")}`;
  const baseSlug = slugify(name);

  let slug = baseSlug;
  let suffix = 2;
  while (slugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return { projectNumber, slug };
}
