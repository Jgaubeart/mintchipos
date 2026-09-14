import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { getArtifactById } from "@/lib/artifacts/queries";
import { PLAYBOOK_BRIEF_ARTIFACT_TYPE } from "@/lib/playbooks/constants";
import { buildIndustryPlaybookSummary } from "@/lib/playbooks/playbook";
import {
  getArtifactVersions,
  getIndustryPlaybookArtifact,
} from "@/lib/playbooks/queries";
import type { IndustryPlaybook } from "@/lib/playbooks/types";
import { formatDate } from "@/lib/projects/format";
import { runPlaybookResearch } from "./actions";

export const metadata: Metadata = {
  title: "Playbook Brief | MintChipOS",
};

type PlaybookDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; ok?: string }>;
};

export default async function PlaybookDetailPage({
  params,
  searchParams,
}: PlaybookDetailPageProps) {
  await requireUser();

  const { id } = await params;
  const search = await searchParams;
  const briefArtifact = await getArtifactById(id);

  if (!briefArtifact || briefArtifact.artifact_type !== PLAYBOOK_BRIEF_ARTIFACT_TYPE) {
    notFound();
  }

  const [briefVersions, playbookArtifact] = await Promise.all([
    getArtifactVersions(briefArtifact.id),
    getIndustryPlaybookArtifact(briefArtifact.project_id),
  ]);
  const playbookVersions = playbookArtifact
    ? await getArtifactVersions(playbookArtifact.id)
    : [];

  const latestPlaybook = playbookVersions[0]?.structured_data as
    | IndustryPlaybook
    | undefined;

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/playbooks"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Playbooks
          </Link>

          {search?.error ? (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {search.error}
            </p>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {briefArtifact.title}
              </h1>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {briefVersions[0]?.content ?? "—"}
              </p>
            </div>

            <div className="border-t border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <form action={runPlaybookResearch}>
                <input type="hidden" name="brief_artifact_id" value={briefArtifact.id} />
                <input type="hidden" name="project_id" value={briefArtifact.project_id} />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Run Research
                </button>
              </form>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Creates a Research Strategist run. Execute it from the run page
                to generate the Industry Playbook.
              </p>
            </div>

            {latestPlaybook ? (
              <div className="border-t border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Generated Industry Playbook
                </h2>
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {buildIndustryPlaybookSummary(latestPlaybook)}
                </pre>

                <h3 className="mt-6 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Evidence / Sources
                </h3>
                {latestPlaybook.evidenceSources.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No sources recorded.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {latestPlaybook.evidenceSources.map((source, index) => (
                      <li key={index} className="text-sm text-zinc-600 dark:text-zinc-400">
                        <a href={source.url} className="font-medium text-zinc-900 underline dark:text-zinc-100" target="_blank" rel="noreferrer">
                          {source.url}
                        </a>
                        <span className="block">{source.note}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            <div className="border-t border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Playbook Versions
              </h2>
              <div className="mt-3 space-y-2">
                {playbookVersions.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No playbook generated yet.</p>
                ) : (
                  playbookVersions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Version {version.version}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{formatDate(version.created_at)}</span>
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
