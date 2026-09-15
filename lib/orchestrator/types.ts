import type {
  OrchestratorIntent,
  OrchestratorMessageRole,
  OrchestratorTaskStatus,
} from "./constants";

export type IntentDetection = {
  intent: OrchestratorIntent;
  url: string | null;
  confidence: number;
};

export type OrchestratorReply = {
  content: string;
  intent: OrchestratorIntent;
  actions?: Array<{
    label: string;
    href: string;
    kind: "preview" | "run" | "project" | "deployment";
  }>;
  task: {
    title: string;
    status: OrchestratorTaskStatus;
    previewUrl?: string | null;
    factoryRunId?: string | null;
    error?: string | null;
  } | null;
};

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
  error: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
};
