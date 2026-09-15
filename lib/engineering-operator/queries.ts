import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  EngineeringTask,
  EngineeringTaskArtifact,
  EngineeringTaskEvent,
} from "@/lib/supabase/database.types";
import type {
  EngineeringApprovalState,
  EngineeringIntent,
  EngineeringProgressStage,
  EngineeringRiskLevel,
  EngineeringTaskEventType,
  EngineeringTaskStatus,
} from "./constants";

export type CreateEngineeringTaskInput = {
  ownerId: string;
  idempotencyKey: string;
  title: string;
  description?: string | null;
  intent: EngineeringIntent;
  category?: string | null;
  priority?: number;
  status?: EngineeringTaskStatus;
  riskLevel: EngineeringRiskLevel;
  repository?: string;
  baseBranch?: string;
  workingBranch?: string | null;
  targetEnvironment?: string;
  approvalState: EngineeringApprovalState;
  orchestratorThreadId?: string | null;
  orchestratorMessageId?: string | null;
};

export async function getEngineeringTaskById(
  taskId: string,
): Promise<EngineeringTask | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function claimEngineeringTask(
  taskId: string,
): Promise<EngineeringTask | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_tasks")
    .update({
      status: "RUNNING",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("status", ["DRAFT", "QUEUED", "BLOCKED", "FAILED"])
    .eq("approval_state", "AUTO_APPROVED")
    .is("commit_sha", null)
    .eq("id", taskId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEngineeringTaskByIdempotencyKey(input: {
  ownerId: string;
  idempotencyKey: string;
}): Promise<EngineeringTask | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_tasks")
    .select("*")
    .eq("owner_id", input.ownerId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createEngineeringTask(
  input: CreateEngineeringTaskInput,
): Promise<EngineeringTask> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_tasks")
    .insert({
      owner_id: input.ownerId,
      idempotency_key: input.idempotencyKey,
      title: input.title,
      description: input.description ?? null,
      intent: input.intent,
      category: input.category ?? null,
      priority: input.priority ?? 3,
      status: input.status ?? "DRAFT",
      risk_level: input.riskLevel,
      repository: input.repository ?? "https://github.com/Jgaubeart/mintchipos",
      base_branch: input.baseBranch ?? "main",
      working_branch: input.workingBranch ?? null,
      target_environment: input.targetEnvironment ?? "PREVIEW",
      approval_state: input.approvalState,
      orchestrator_thread_id: input.orchestratorThreadId ?? null,
      orchestrator_message_id: input.orchestratorMessageId ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEngineeringTasksForThread(
  threadId: string,
): Promise<EngineeringTask[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_tasks")
    .select("*")
    .eq("orchestrator_thread_id", threadId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getOpenEngineeringTasks(): Promise<EngineeringTask[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_tasks")
    .select("*")
    .in("status", [
      "DRAFT",
      "QUEUED",
      "PLANNING",
      "RUNNING",
      "VERIFYING",
    ])
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createEngineeringTaskEvent(input: {
  taskId: string;
  type: EngineeringTaskEventType;
  summary: string;
  metadata?: Record<string, unknown>;
  attempt?: number;
}): Promise<EngineeringTaskEvent> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_task_events")
    .insert({
      task_id: input.taskId,
      type: input.type,
      summary: input.summary,
      metadata: input.metadata ?? {},
      attempt: input.attempt ?? 1,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEngineeringTaskEvents(
  taskId: string,
): Promise<EngineeringTaskEvent[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_task_events")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createEngineeringTaskArtifact(input: {
  taskId: string;
  kind: string;
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<EngineeringTaskArtifact> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("engineering_task_artifacts")
    .insert({
      task_id: input.taskId,
      kind: input.kind,
      reference: input.reference,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateEngineeringTask(input: {
  taskId: string;
  status?: EngineeringTaskStatus;
  workingBranch?: string | null;
  baseBranch?: string | null;
  commitSha?: string | null;
  testsSummary?: string | null;
  previewDeploymentId?: string | null;
  verificationStatus?: string | null;
  blocker?: string | null;
  progressStage?: EngineeringProgressStage | null;
  startedAt?: string | null;
  completedAt?: string | null;
}): Promise<EngineeringTask | null> {
  const supabase = await createClient<Database>();
  const update: Partial<EngineeringTask> = {};

  if (input.status !== undefined) {
    update.status = input.status;
  }
  if (input.workingBranch !== undefined) {
    update.working_branch = input.workingBranch;
  }
  if (input.baseBranch !== undefined) {
    update.base_branch = input.baseBranch;
  }
  if (input.commitSha !== undefined) {
    update.commit_sha = input.commitSha;
  }
  if (input.testsSummary !== undefined) {
    update.tests_summary = input.testsSummary;
  }
  if (input.previewDeploymentId !== undefined) {
    update.preview_deployment_id = input.previewDeploymentId;
  }
  if (input.verificationStatus !== undefined) {
    update.verification_status = input.verificationStatus;
  }
  if (input.blocker !== undefined) {
    update.blocker = input.blocker;
  }
  if (input.progressStage !== undefined) {
    update.progress_stage = input.progressStage;
  }
  if (input.startedAt !== undefined) {
    update.started_at = input.startedAt;
  }
  if (input.completedAt !== undefined) {
    update.completed_at = input.completedAt;
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("engineering_tasks")
    .update(update)
    .eq("id", input.taskId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
