import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  OrchestratorMessage,
  OrchestratorTask,
  OrchestratorThread,
  WebsiteFactoryRun,
} from "@/lib/supabase/database.types";
import type {
  OrchestratorIntent,
  OrchestratorMessageRole,
  OrchestratorTaskStatus,
} from "./constants";

export async function getOrchestratorThreads(
  limit = 50,
): Promise<OrchestratorThread[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("orchestrator_threads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getOrchestratorThread(
  threadId: string,
): Promise<OrchestratorThread | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("orchestrator_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getOrchestratorMessages(
  threadId: string,
): Promise<OrchestratorMessage[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("orchestrator_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getOrchestratorTasks(
  threadId: string,
): Promise<OrchestratorTask[]> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("orchestrator_tasks")
    .select("*")
    .eq("thread_id", threadId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createOrchestratorThread(input: {
  ownerId: string;
  title: string;
}): Promise<OrchestratorThread> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("orchestrator_threads")
    .insert({
      owner_id: input.ownerId,
      title: input.title,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createOrchestratorMessage(input: {
  threadId: string;
  role: OrchestratorMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<OrchestratorMessage> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("orchestrator_messages")
    .insert({
      thread_id: input.threadId,
      role: input.role,
      content: input.content,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createOrchestratorTask(input: {
  threadId: string;
  messageId: string | null;
  intent: OrchestratorIntent;
  status: OrchestratorTaskStatus;
  projectId?: string | null;
  factoryRunId?: string | null;
  deploymentId?: string | null;
  engineeringTaskId?: string | null;
  error?: Record<string, unknown> | null;
}): Promise<OrchestratorTask> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("orchestrator_tasks")
    .insert({
      thread_id: input.threadId,
      message_id: input.messageId,
      intent: input.intent,
      status: input.status,
      project_id: input.projectId ?? null,
      factory_run_id: input.factoryRunId ?? null,
      deployment_id: input.deploymentId ?? null,
      engineering_task_id: input.engineeringTaskId ?? null,
      error: input.error ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateOrchestratorThreadTitle(
  threadId: string,
  title: string,
): Promise<void> {
  const supabase = await createClient<Database>();
  const { error } = await supabase
    .from("orchestrator_threads")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", threadId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getLatestFactoryRunWithPreview(): Promise<WebsiteFactoryRun | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("website_factory_runs")
    .select("*")
    .not("preview_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLatestFactoryRun(): Promise<WebsiteFactoryRun | null> {
  const supabase = await createClient<Database>();
  const { data, error } = await supabase
    .from("website_factory_runs")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
