import type { Metadata } from "next";
import Link from "next/link";
import { formatRunStatus, formatTriggerType } from "@/lib/agents/format";
import { getAgentRuns } from "@/lib/agents/queries";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/projects/format";

export const metadata: Metadata = {
  title: "Runs | MintChipOS",
};

export default async function RunsPage() {
  await requireUser();
  const runs = await getAgentRuns();

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Runs
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Recorded agent execution attempts.
            </p>
          </div>

          {runs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No runs yet.
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create a test run from an agent detail page.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {runs.map((run) => (
                  <li key={run.id}>
                    <Link
                      href={`/runs/${run.id}`}
                      className="flex flex-col gap-3 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {run.agent_name}
                            </span>
                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                              {formatRunStatus(run.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {run.project_name} · {formatTriggerType(run.trigger_type)}
                          </p>
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {run.model_provider && run.model_name
                            ? `${run.model_provider} / ${run.model_name}`
                            : "—"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
                        <span>Created {formatDate(run.created_at)}</span>
                        {run.started_at ? (
                          <span>Started {formatDate(run.started_at)}</span>
                        ) : null}
                        {run.completed_at ? (
                          <span>Completed {formatDate(run.completed_at)}</span>
                        ) : null}
                        {run.duration_ms !== null ? (
                          <span>{run.duration_ms} ms</span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
