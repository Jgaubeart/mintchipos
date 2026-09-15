import { getAgentDefinitionByKey, getAgentRunById } from "@/lib/agents/queries";
import { executeAgentRun } from "@/lib/execution/execute";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  WebsiteFactoryAgentRuntime,
} from "./types";
import type { WebsiteFactoryStage } from "./constants";

export class HermesWebsiteFactoryAgentRuntime
  implements WebsiteFactoryAgentRuntime
{
  async executeStage(input: {
    stage: WebsiteFactoryStage;
    agentKey: string;
    projectId: string;
    stageInput: unknown;
  }): Promise<{ output: unknown; agentRunId: string }> {
    const agent = await getAgentDefinitionByKey(input.agentKey);
    if (!agent) {
      throw new Error(`Agent definition not found: ${input.agentKey}`);
    }

    const supabase = await createClient<Database>();
    const { data: runId, error } = await supabase.rpc("create_agent_run", {
      p_project_id: input.projectId,
      p_agent_definition_id: agent.id,
      p_trigger_reason: `Website Factory stage: ${input.stage}`,
      p_workflow_stage: input.stage,
      p_input_snapshot: {
        user_message: JSON.stringify(input.stageInput),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    await executeAgentRun(runId);

    const run = await getAgentRunById(runId);
    if (!run || run.status !== "SUCCEEDED") {
      throw new Error(
        run?.error_message ?? `Agent run ${input.agentKey} did not succeed.`,
      );
    }

    return {
      output: run.output_snapshot,
      agentRunId: run.id,
    };
  }
}

export class BlockedWebsiteFactoryAgentRuntime
  implements WebsiteFactoryAgentRuntime
{
  async executeStage(): Promise<{ output: unknown; agentRunId: string }> {
    throw new Error(
      "Live Hermes agent execution is not enabled. Set WEBSITE_FACTORY_LIVE=true and approve the paid run before generating a demo.",
    );
  }
}

export function getWebsiteFactoryAgentRuntime(): WebsiteFactoryAgentRuntime {
  const liveEnabled =
    process.env.WEBSITE_FACTORY_LIVE?.trim().toLowerCase() === "true";
  const hermesConfigured = Boolean(
    process.env.HERMES_API_URL?.trim() && process.env.HERMES_API_KEY?.trim(),
  );

  return liveEnabled && hermesConfigured
    ? new HermesWebsiteFactoryAgentRuntime()
    : new BlockedWebsiteFactoryAgentRuntime();
}
