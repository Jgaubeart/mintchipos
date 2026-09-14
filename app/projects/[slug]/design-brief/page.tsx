import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { formatArtifactStatus } from "@/lib/artifacts/format";
import { requireUser } from "@/lib/auth/require-user";
import {
  getDesignBriefArtifact,
  getDesignBriefVersions,
} from "@/lib/design-brief/queries";
import { formatDate } from "@/lib/projects/format";
import { getProjectBySlug } from "@/lib/projects/queries";

export const metadata: Metadata = {
  title: "Design Direction Brief | MintChipOS",
};

type DesignBriefPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DesignBriefPage({
  params,
}: DesignBriefPageProps) {
  await requireUser();

  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const artifact = await getDesignBriefArtifact(project.id);
  const versions = artifact ? await getDesignBriefVersions(artifact.id) : [];

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to {project.name}
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Design Direction Brief
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {artifact
                  ? `Version ${versions[0]?.version ?? "—"} · ${formatArtifactStatus(artifact.status)}`
                  : "No brief yet."}
              </p>
            </div>
            <Link
              href={`/projects/${project.slug}/design-brief/edit`}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {artifact ? "Edit Brief" : "Create Brief"}
            </Link>
          </div>

          {versions.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No Design Direction Brief yet.
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create the brief to define what this website should look like,
                feel like, and accomplish.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {versions.map((version) => (
                <article
                  key={version.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Version {version.version}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(version.created_at)}
                    </p>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                    {version.content}
                  </pre>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
