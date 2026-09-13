import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatJson,
  formatRelationship,
  formatRunStatus,
  formatTriggerType,
} from "@/lib/agents/format";
import {
  getAgentDefinitionById,
  getAgentDefinitionVersionById,
  getAgentRunById,
  getAgentRunLineage,
} from "@/lib/agents/queries";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/projects/format";
import { getProjectById } from "@/lib/projects/queries";

export const metadata: Metadata = {
  title: "Run | MintChipOS",
};

type RunDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  await requireUser();

  const { id } = await params;
  const run = await getAgentRunById(id);

  if (!run) {
    notFound();
  }

  const [agent, version, project, lineage] = await Promise.all([
    getAgentDefinitionById(run.agent_definition_id),
    getAgentDefinitionVersionById(run.agent_definition_version_id),
    getProjectById(run.project_id),
    getAgentRunLineage(run.id),
  ]);

  const details = [
    { label: "Status", value: formatRunStatus(run.status) },
    { label: "Trigger", value: formatTriggerType(run.trigger_type) },
    { label: "Workflow stage", value: run.workflow_stage ?? "—" },
    { label: "Model", value: run.model_name ?? "—" },
    { label: "Provider", value: run.model_provider ?? "—" },
    { label: "Model policy key", value: run.model_policy_key ?? "—" },
    { label: "Started", value: formatDate(run.started_at) },
    { label: "Completed", value: formatDate(run.completed_at) },
    { label: "Duration", value: run.duration_ms !== null ? `${run.duration_ms} ms` : "—" },
    { label: "Input tokens", value: run.input_tokens !== null ? String(run.input_tokens) : "—" },
    { label: "Output tokens", value: run.output_tokens !== null ? String(run.output_tokens) : "—" },
    { label: "Estimated cost", value: run.estimated_cost_usd !== null ? `$${run.estimated_cost_usd}` : "—" },
    { label: "Retry count", value: String(run.retry_count) },
  ];

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/runs"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Runs
          </Link>

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {formatRunStatus(run.status)}
                </span>
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {formatTriggerType(run.trigger_type)}
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {agent?.name ?? "Agent"}
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {project?.name ?? "Project"} · {agent?.key ?? "—"} · version{" "}
                {version?.version ?? "—"}
              </p>
              {run.trigger_reason ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {run.trigger_reason}
                </p>
              ) : null}
            </div>

            <dl className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              {details.map((detail) => (
                <div key={detail.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {detail.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>

            {run.error_code || run.error_message ? (
              <div className="border-t border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
                <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Error
                </h2>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {run.error_code ? `${run.error_code}: ` : ""}
                  {run.error_message ?? "Unknown error"}
                </p>
              </div>
            ) : null}

            <div className="grid gap-6 border-t border-zinc-100 p-6 dark:border-zinc-900 sm:grid-cols-2 sm:p-8">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Input Snapshot
                </h2>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs leading-5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {formatJson(run.input_snapshot)}
                </pre>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Output Snapshot
                </h2>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs leading-5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {formatJson(run.output_snapshot)}
                </pre>
              </div>
            </div>

            <div className="border-t border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Artifact Lineage
              </h2>

              <div className="mt-5 space-y-3">
                {lineage.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No artifact lineage recorded.
                  </p>
                ) : (
                  lineage.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.artifact_title}
                        </p>
                        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                          {formatRelationship(item.relationship)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {item.artifact_type} · v{item.version_number ?? "—"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
