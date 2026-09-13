import type { ProjectType } from "@/lib/projects/constants";

export type ProjectRow = {
  id: string;
  project_number: string | null;
  name: string;
  slug: string;
  project_type: ProjectType | null;
  lifecycle_status: string | null;
  production_stage: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Project = ProjectRow;

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow>;
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_mintchip_project_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
};
