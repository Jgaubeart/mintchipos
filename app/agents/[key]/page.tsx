import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import {
  getAgentDefinitionByKey,
  getAgentDefinitionVersions,
} from "@/lib/agents/queries";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/projects/format";
import { getProjects } from "@/lib/projects/queries";
import CreateTestRunForm from "./create-test-run-form";

export const metadata: Metadata = {
  title: "Agent | MintChipOS",
};

type AgentDetailPageProps = {
  params: Promise<{ key: string }>;
};

export default async function AgentDetailPage({
  params,
}: AgentDetailPageProps) {
  await requireUser();

  const { key } = await params;
  const definition = await getAgentDefinitionByKey(key);

  if (!definition) {
    notFound();
  }

  const [versions, projects] = await Promise.all([
    getAgentDefinitionVersions(definition.id),
    getProjects(),
  ]);

  const currentVersion = versions.find(
    (version) => version.id === definition.current_version_id,
  );

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Agents
          </Link>

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {definition.key}
                </span>
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {definition.active ? "Active" : "Inactive"}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {definition.name}
              </h1>
              {definition.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {definition.description}
                </p>
              ) : null}
              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Current version
                  </p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">
                    v{currentVersion?.version ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Model policy key
                  </p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {currentVersion?.model_policy_key ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Current Instructions
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {currentVersion?.instructions ?? "No instructions."}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Version History
              </h2>

              <div className="mt-5 space-y-3">
                {versions.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No versions yet.
                  </p>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Version {version.version}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDate(version.created_at)}
                        </p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {version.instructions}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Create Test Run
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Records a pending manual execution record. No model is invoked.
            </p>
            <div className="mt-4">
              <CreateTestRunForm
                agentDefinitionId={definition.id}
                projects={projects.map((project) => ({
                  id: project.id,
                  name: project.name,
                }))}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
