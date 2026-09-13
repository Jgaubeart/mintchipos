import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { formatArtifactStatus, formatArtifactType } from "@/lib/artifacts/format";
import { getProjectArtifacts } from "@/lib/artifacts/queries";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate, formatField } from "@/lib/projects/format";
import { getProjectBySlug } from "@/lib/projects/queries";

export const metadata: Metadata = {
  title: "Project | MintChipOS",
};

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  await requireUser();

  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const artifacts = await getProjectArtifacts(project.id);

  const details = [
    { label: "Project number", value: formatField(project.project_number) },
    { label: "Project type", value: formatField(project.project_type) },
    { label: "Lifecycle status", value: formatField(project.lifecycle_status) },
    { label: "Production stage", value: formatField(project.production_stage) },
    { label: "Created", value: formatDate(project.created_at) },
    { label: "Updated", value: formatDate(project.updated_at) },
  ];

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Projects
          </Link>

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                {formatField(project.project_number)}
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {formatField(project.name)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {project.description
                  ? project.description
                  : "No description provided."}
              </p>
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
          </div>

          <section className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Artifacts
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Project knowledge and outputs.
                </p>
              </div>
              <Link
                href={`/projects/${project.slug}/artifacts/new`}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                New Artifact
              </Link>
            </div>

            <div className="mt-5">
              {artifacts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    No artifacts yet.
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Create the first artifact for this project.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {artifacts.map((artifact) => (
                      <li key={artifact.id}>
                        <Link
                          href={`/projects/${project.slug}/artifacts/${artifact.id}`}
                          className="flex flex-col gap-2 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {artifact.title}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              {formatArtifactType(artifact.artifact_type)}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <span>{formatArtifactStatus(artifact.status)}</span>
                            <span aria-hidden="true">/</span>
                            <span>
                              v{artifact.current_version_number ?? "—"}
                            </span>
                            <span aria-hidden="true">/</span>
                            <span>{formatDate(artifact.updated_at)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
