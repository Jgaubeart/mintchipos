import type { ProjectType } from "@/lib/projects/constants";
import type {
  ArtifactCreatorType,
  ArtifactStatus,
  ArtifactType,
} from "@/lib/artifacts/constants";

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

export type ArtifactRow = {
  id: string;
  project_id: string;
  artifact_type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  current_version_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ArtifactVersionRow = {
  id: string;
  artifact_id: string;
  version: number;
  content: string;
  structured_data: unknown;
  created_by_type: ArtifactCreatorType;
  created_by_user_id: string | null;
  created_by_agent_run_id: string | null;
  created_at: string | null;
};

export type Artifact = ArtifactRow;
export type ArtifactVersion = ArtifactVersionRow;

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow>;
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      artifacts: {
        Row: ArtifactRow;
        Insert: Partial<ArtifactRow>;
        Update: Partial<ArtifactRow>;
        Relationships: [];
      };
      artifact_versions: {
        Row: ArtifactVersionRow;
        Insert: Partial<ArtifactVersionRow>;
        Update: Partial<ArtifactVersionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_mintchip_project_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_artifact: {
        Args: {
          p_project_id: string;
          p_artifact_type: string;
          p_title: string;
          p_content: string;
          p_structured_data?: unknown;
        };
        Returns: string;
      };
      add_artifact_version: {
        Args: {
          p_artifact_id: string;
          p_content: string;
          p_structured_data?: unknown;
        };
        Returns: string;
      };
    };
  };
};
