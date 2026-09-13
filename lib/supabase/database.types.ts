import type { ProjectType } from "@/lib/projects/constants";
import type {
  ArtifactCreatorType,
  ArtifactStatus,
  ArtifactType,
} from "@/lib/artifacts/constants";
import type {
  AgentRunArtifactRelationship,
  AgentRunStatus,
  AgentTriggerType,
} from "@/lib/agents/constants";

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

export type AgentDefinitionRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  active: boolean;
  current_version_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AgentDefinitionVersionRow = {
  id: string;
  agent_definition_id: string;
  version: number;
  instructions: string;
  input_schema: unknown;
  output_schema: unknown;
  quality_rubric: unknown;
  permission_config: unknown;
  model_policy_key: string | null;
  created_by: string | null;
  created_at: string | null;
};

export type AgentRunRow = {
  id: string;
  project_id: string;
  agent_definition_id: string;
  agent_definition_version_id: string;
  trigger_type: AgentTriggerType;
  trigger_reason: string | null;
  workflow_stage: string | null;
  status: AgentRunStatus;
  model_provider: string | null;
  model_name: string | null;
  model_policy_key: string | null;
  input_snapshot: unknown;
  output_snapshot: unknown;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;
  retry_count: number;
  error_code: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string | null;
};

export type AgentRunArtifactRow = {
  id: string;
  agent_run_id: string;
  artifact_version_id: string;
  relationship: AgentRunArtifactRelationship;
  created_at: string | null;
};

export type AgentDefinition = AgentDefinitionRow;
export type AgentDefinitionVersion = AgentDefinitionVersionRow;
export type AgentRun = AgentRunRow;
export type AgentRunArtifact = AgentRunArtifactRow;

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
      agent_definitions: {
        Row: AgentDefinitionRow;
        Insert: Partial<AgentDefinitionRow>;
        Update: Partial<AgentDefinitionRow>;
        Relationships: [];
      };
      agent_definition_versions: {
        Row: AgentDefinitionVersionRow;
        Insert: Partial<AgentDefinitionVersionRow>;
        Update: Partial<AgentDefinitionVersionRow>;
        Relationships: [];
      };
      agent_runs: {
        Row: AgentRunRow;
        Insert: Partial<AgentRunRow>;
        Update: Partial<AgentRunRow>;
        Relationships: [];
      };
      agent_run_artifacts: {
        Row: AgentRunArtifactRow;
        Insert: Partial<AgentRunArtifactRow>;
        Update: Partial<AgentRunArtifactRow>;
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
      create_agent_definition: {
        Args: {
          p_key: string;
          p_name: string;
          p_description?: string | null;
          p_instructions: string;
          p_input_schema?: unknown;
          p_output_schema?: unknown;
          p_quality_rubric?: unknown;
          p_permission_config?: unknown;
          p_model_policy_key?: string | null;
        };
        Returns: string;
      };
      add_agent_definition_version: {
        Args: {
          p_agent_definition_id: string;
          p_instructions: string;
          p_input_schema?: unknown;
          p_output_schema?: unknown;
          p_quality_rubric?: unknown;
          p_permission_config?: unknown;
          p_model_policy_key?: string | null;
        };
        Returns: string;
      };
      update_agent_definition: {
        Args: {
          p_agent_definition_id: string;
          p_name: string;
          p_description?: string | null;
          p_active?: boolean;
        };
        Returns: null;
      };
      create_agent_run: {
        Args: {
          p_project_id: string;
          p_agent_definition_id: string;
          p_trigger_reason?: string | null;
          p_workflow_stage?: string | null;
        };
        Returns: string;
      };
      add_agent_run_artifact: {
        Args: {
          p_agent_run_id: string;
          p_artifact_version_id: string;
          p_relationship: string;
        };
        Returns: string;
      };
    };
  };
};
