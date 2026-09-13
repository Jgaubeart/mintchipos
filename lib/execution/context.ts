export type ProjectContextSource = {
  project_number: string | null;
  name: string;
  slug: string;
  project_type: string | null;
  lifecycle_status: string | null;
  production_stage: string | null;
  description: string | null;
};

export function buildProjectContext(project: ProjectContextSource): string {
  return [
    "Project context:",
    `- Project number: ${project.project_number ?? "—"}`,
    `- Name: ${project.name}`,
    `- Slug: ${project.slug}`,
    `- Type: ${project.project_type ?? "—"}`,
    `- Lifecycle status: ${project.lifecycle_status ?? "—"}`,
    `- Production stage: ${project.production_stage ?? "—"}`,
    `- Description: ${project.description?.trim() || "—"}`,
  ].join("\n");
}
