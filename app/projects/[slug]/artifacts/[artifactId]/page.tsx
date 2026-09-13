import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { formatArtifactStatus, formatArtifactType } from "@/lib/artifacts/format";
import {
  getArtifactById,
  getArtifactVersions,
} from "@/lib/artifacts/queries";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/projects/format";
import { getProjectBySlug } from "@/lib/projects/queries";
import AddVersionForm from "./add-version-form";

export const metadata: Metadata = {
  title: "Artifact | MintChipOS",
};

type ArtifactDetailPageProps = {
  params: Promise<{ slug: string; artifactId: string }>;
};

export default async function ArtifactDetailPage({
  params,
}: ArtifactDetailPageProps) {
  await requireUser();

  const { slug, artifactId } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const artifact = await getArtifactById(artifactId);

  if (!artifact || artifact.project_id !== project.id) {
    notFound();
  }

  const versions = await getArtifactVersions(artifactId);

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

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {formatArtifactType(artifact.artifact_type)}
                </span>
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {formatArtifactStatus(artifact.status)}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {artifact.title}
              </h1>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Updated {formatDate(artifact.updated_at)}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Version History
              </h2>

              <div className="mt-5 space-y-4">
                {versions.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No versions yet.
                  </p>
                ) : (
                  versions.map((version) => (
                    <article
                      key={version.id}
                      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Version {version.version}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDate(version.created_at)} · {version.created_by_type}
                        </p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {version.content}
                      </p>
                    </article>
                  ))
                )}
              </div>

              <div className="mt-8 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Add Version
                </h3>
                <div className="mt-4">
                  <AddVersionForm
                    projectSlug={project.slug}
                    artifactId={artifact.id}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
