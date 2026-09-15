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
import type {
  SkillSourceType,
  ToolPermissionLevel,
  ToolRiskLevel,
} from "@/lib/capabilities/constants";
import type {
  DemoProviderName,
  DeploymentStatus,
  DeploymentType,
  PreviewVisibility,
} from "@/lib/demo-staging/constants";
import type {
  DiscoverySource,
  ProspectStatus,
  ScanStatus,
  VisualAuditStatus,
} from "@/lib/prospecting/constants";
import type {
  WebsiteFactoryRunStatus,
  WebsiteFactoryStage,
} from "@/lib/website-factory/constants";
import type {
  OrchestratorIntent,
  OrchestratorMessageRole,
  OrchestratorTaskStatus,
} from "@/lib/orchestrator/constants";
import type {
  EngineeringApprovalState,
  EngineeringIntent,
  EngineeringProgressStage,
  EngineeringRiskLevel,
  EngineeringTaskEventType,
  EngineeringTaskStatus,
} from "@/lib/engineering-operator/constants";

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
  runtime_provider: string | null;
  runtime_run_id: string | null;
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

export type SkillRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  active: boolean;
  current_version_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SkillVersionRow = {
  id: string;
  skill_id: string;
  version: number;
  instructions: string;
  metadata: unknown;
  source_type: SkillSourceType | null;
  source_reference: string | null;
  created_by: string | null;
  created_at: string | null;
};

export type ToolRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  active: boolean;
  risk_level: ToolRiskLevel;
  execution_category: string | null;
  configuration_schema: unknown;
  created_at: string | null;
  updated_at: string | null;
};

export type AgentSkillRow = {
  id: string;
  agent_definition_id: string;
  skill_id: string;
  required: boolean;
  enabled: boolean;
  created_at: string | null;
};

export type AgentToolRow = {
  id: string;
  agent_definition_id: string;
  tool_id: string;
  permission_level: ToolPermissionLevel;
  enabled: boolean;
  created_at: string | null;
};

export type Skill = SkillRow;
export type SkillVersion = SkillVersionRow;
export type Tool = ToolRow;
export type AgentSkill = AgentSkillRow;
export type AgentTool = AgentToolRow;

export type DeploymentRow = {
  id: string;
  project_id: string;
  prospect_id: string | null;
  deployment_type: DeploymentType;
  status: DeploymentStatus;
  provider: DemoProviderName;
  provider_deployment_id: string | null;
  preview_url: string | null;
  preview_hostname: string | null;
  preview_visibility: PreviewVisibility;
  source_artifact_id: string | null;
  source_artifact_type: string | null;
  source_commit: string | null;
  build_id: string | null;
  version: number;
  metadata: Record<string, unknown>;
  is_current: boolean;
  failure_reason: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  deployed_at: string | null;
  failed_at: string | null;
  superseded_at: string | null;
};

export type Deployment = DeploymentRow;

export type WebsiteFactoryRunRow = {
  id: string;
  project_id: string;
  website_url: string;
  business_name: string | null;
  status: WebsiteFactoryRunStatus;
  current_stage: WebsiteFactoryStage | null;
  progress: number;
  stages: Record<string, unknown>[];
  artifacts: Record<string, unknown>[];
  preview_url: string | null;
  provider_deployment_id: string | null;
  failure_reason: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WebsiteFactoryRun = WebsiteFactoryRunRow;

export type OrchestratorThreadRow = {
  id: string;
  owner_id: string;
  title: string;
  created_at: string | null;
  updated_at: string | null;
};

export type OrchestratorMessageRow = {
  id: string;
  thread_id: string;
  role: OrchestratorMessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string | null;
};

export type OrchestratorTaskRow = {
  id: string;
  thread_id: string;
  message_id: string | null;
  intent: OrchestratorIntent;
  status: OrchestratorTaskStatus;
  project_id: string | null;
  factory_run_id: string | null;
  deployment_id: string | null;
  engineering_task_id: string | null;
  error: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
};

export type OrchestratorThread = OrchestratorThreadRow;
export type OrchestratorMessage = OrchestratorMessageRow;
export type OrchestratorTask = OrchestratorTaskRow;

export type EngineeringTaskRow = {
  id: string;
  owner_id: string;
  orchestrator_thread_id: string | null;
  orchestrator_message_id: string | null;
  idempotency_key: string | null;
  title: string;
  description: string | null;
  intent: EngineeringIntent;
  category: string | null;
  priority: number;
  status: EngineeringTaskStatus;
  risk_level: EngineeringRiskLevel;
  repository: string;
  base_branch: string;
  working_branch: string | null;
  target_environment: string;
  approval_state: EngineeringApprovalState;
  execution_runtime: string | null;
  external_run_id: string | null;
  commit_sha: string | null;
  migration_references: string[];
  preview_deployment_id: string | null;
  verification_status: string | null;
  blocker: string | null;
  progress_stage: EngineeringProgressStage | null;
  tests_summary: string | null;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

export type EngineeringTaskEventRow = {
  id: string;
  task_id: string;
  type: EngineeringTaskEventType;
  summary: string;
  metadata: Record<string, unknown>;
  attempt: number;
  created_at: string | null;
};

export type EngineeringTaskArtifactRow = {
  id: string;
  task_id: string;
  kind: string;
  reference: string;
  metadata: Record<string, unknown>;
  created_at: string | null;
};

export type EngineeringTask = EngineeringTaskRow;
export type EngineeringTaskEvent = EngineeringTaskEventRow;
export type EngineeringTaskArtifact = EngineeringTaskArtifactRow;

export type ProspectScanRow = {
  id: string;
  location: string;
  radius_km: number | null;
  industries: string[];
  categories: string[];
  max_prospects: number;
  exclusions: string[];
  status: ScanStatus;
  source_config: Record<string, unknown>;
  discovered_count: number;
  audited_count: number;
  qualified_count: number;
  disqualified_count: number;
  error_count: number;
  errors: string[];
  created_by: string | null;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type ProspectRow = {
  id: string;
  business_name: string;
  website_url: string | null;
  domain: string | null;
  industry: string | null;
  industry_subtype: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  public_email: string | null;
  contact_page_url: string | null;
  social_urls: string[];
  discovery_source: DiscoverySource;
  discovered_at: string | null;
  scan_id: string | null;
  source_url: string | null;
  source_metadata: Record<string, unknown>;
  duplicate_fingerprint: string;
  appears_active: boolean | null;
  local_business: boolean | null;
  location_count: number | null;
  review_presence: boolean | null;
  review_count: number | null;
  rating: number | null;
  service_summary: string | null;
  business_description: string | null;
  confidence: number | null;
  website_present: boolean;
  website_reachable: boolean;
  https_present: boolean;
  mobile_responsive: boolean | null;
  page_count_estimate: number;
  broken_links: string[];
  contact_cta_present: boolean;
  phone_cta_present: boolean;
  contact_form_present: boolean;
  portfolio_present: boolean;
  testimonials_present: boolean;
  last_modified_at: string | null;
  visual_audit_status: VisualAuditStatus;
  audit_notes: string[];
  audit_timestamp: string | null;
  email_found: boolean;
  email: string | null;
  email_source_url: string | null;
  phone_found: boolean;
  contact_page_found: boolean;
  contactability_confidence: number | null;
  prospect_status: ProspectStatus;
  qualification_score: number;
  website_opportunity_score: number;
  business_quality_score: number;
  contactability_score: number;
  disqualification_reasons: string[];
  qualification_reasons: string[];
  created_at: string | null;
  updated_at: string | null;
};

export type ProspectScan = ProspectScanRow;
export type Prospect = ProspectRow;

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
      skills: {
        Row: SkillRow;
        Insert: Partial<SkillRow>;
        Update: Partial<SkillRow>;
        Relationships: [];
      };
      skill_versions: {
        Row: SkillVersionRow;
        Insert: Partial<SkillVersionRow>;
        Update: Partial<SkillVersionRow>;
        Relationships: [];
      };
      tools: {
        Row: ToolRow;
        Insert: Partial<ToolRow>;
        Update: Partial<ToolRow>;
        Relationships: [];
      };
      agent_skills: {
        Row: AgentSkillRow;
        Insert: Partial<AgentSkillRow>;
        Update: Partial<AgentSkillRow>;
        Relationships: [];
      };
      agent_tools: {
        Row: AgentToolRow;
        Insert: Partial<AgentToolRow>;
        Update: Partial<AgentToolRow>;
        Relationships: [];
      };
      deployments: {
        Row: DeploymentRow;
        Insert: Partial<DeploymentRow>;
        Update: Partial<DeploymentRow>;
        Relationships: [];
      };
      website_factory_runs: {
        Row: WebsiteFactoryRunRow;
        Insert: Partial<WebsiteFactoryRunRow>;
        Update: Partial<WebsiteFactoryRunRow>;
        Relationships: [];
      };
      orchestrator_threads: {
        Row: OrchestratorThreadRow;
        Insert: Partial<OrchestratorThreadRow>;
        Update: Partial<OrchestratorThreadRow>;
        Relationships: [];
      };
      orchestrator_messages: {
        Row: OrchestratorMessageRow;
        Insert: Partial<OrchestratorMessageRow>;
        Update: Partial<OrchestratorMessageRow>;
        Relationships: [];
      };
      orchestrator_tasks: {
        Row: OrchestratorTaskRow;
        Insert: Partial<OrchestratorTaskRow>;
        Update: Partial<OrchestratorTaskRow>;
        Relationships: [];
      };
      engineering_tasks: {
        Row: EngineeringTaskRow;
        Insert: Partial<EngineeringTaskRow>;
        Update: Partial<EngineeringTaskRow>;
        Relationships: [];
      };
      engineering_task_events: {
        Row: EngineeringTaskEventRow;
        Insert: Partial<EngineeringTaskEventRow>;
        Update: Partial<EngineeringTaskEventRow>;
        Relationships: [];
      };
      engineering_task_artifacts: {
        Row: EngineeringTaskArtifactRow;
        Insert: Partial<EngineeringTaskArtifactRow>;
        Update: Partial<EngineeringTaskArtifactRow>;
        Relationships: [];
      };
      prospect_scans: {
        Row: ProspectScanRow;
        Insert: Partial<ProspectScanRow>;
        Update: Partial<ProspectScanRow>;
        Relationships: [];
      };
      prospects: {
        Row: ProspectRow;
        Insert: Partial<ProspectRow>;
        Update: Partial<ProspectRow>;
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
          p_input_snapshot?: unknown;
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
      persist_agent_output_artifact: {
        Args: {
          p_project_id: string;
          p_agent_run_id: string;
          p_artifact_type: string;
          p_title: string;
          p_content: string;
          p_structured_data?: unknown;
        };
        Returns: string;
      };
      create_skill: {
        Args: {
          p_key: string;
          p_name: string;
          p_instructions: string;
          p_description?: string | null;
          p_source_type?: string | null;
          p_source_reference?: string | null;
          p_metadata?: unknown;
        };
        Returns: string;
      };
      add_skill_version: {
        Args: {
          p_skill_id: string;
          p_instructions: string;
          p_source_type?: string | null;
          p_source_reference?: string | null;
          p_metadata?: unknown;
        };
        Returns: string;
      };
      update_skill: {
        Args: {
          p_skill_id: string;
          p_name: string;
          p_description?: string | null;
          p_active?: boolean;
        };
        Returns: null;
      };
      assign_skill_to_agent: {
        Args: {
          p_agent_definition_id: string;
          p_skill_id: string;
          p_required?: boolean;
          p_enabled?: boolean;
        };
        Returns: string;
      };
      set_agent_skill_enabled: {
        Args: {
          p_agent_skill_id: string;
          p_enabled: boolean;
        };
        Returns: null;
      };
      remove_agent_skill: {
        Args: {
          p_agent_skill_id: string;
        };
        Returns: null;
      };
      assign_tool_to_agent: {
        Args: {
          p_agent_definition_id: string;
          p_tool_id: string;
          p_permission_level: string;
          p_enabled?: boolean;
        };
        Returns: string;
      };
      set_agent_tool_enabled: {
        Args: {
          p_agent_tool_id: string;
          p_enabled: boolean;
        };
        Returns: null;
      };
      remove_agent_tool: {
        Args: {
          p_agent_tool_id: string;
        };
        Returns: null;
      };
      mark_agent_run_running: {
        Args: {
          p_agent_run_id: string;
        };
        Returns: null;
      };
      set_agent_run_runtime: {
        Args: {
          p_agent_run_id: string;
          p_runtime_provider: string;
          p_runtime_run_id: string;
        };
        Returns: null;
      };
      complete_agent_run_success: {
        Args: {
          p_agent_run_id: string;
          p_output_snapshot: unknown;
          p_model_provider: string | null;
          p_model_name: string | null;
          p_model_policy_key: string | null;
          p_runtime_provider: string | null;
          p_runtime_run_id: string | null;
          p_duration_ms: number | null;
          p_input_tokens: number | null;
          p_output_tokens: number | null;
          p_estimated_cost_usd: number | null;
        };
        Returns: null;
      };
      fail_agent_run: {
        Args: {
          p_agent_run_id: string;
          p_error_code: string;
          p_error_message: string;
          p_runtime_provider?: string | null;
          p_runtime_run_id?: string | null;
        };
        Returns: null;
      };
    };
  };
};
