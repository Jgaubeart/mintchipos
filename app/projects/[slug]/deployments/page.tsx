import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import {
  formatDate,
  formatDeploymentStatus,
  formatDeploymentType,
  formatField,
  formatPreviewVisibility,
} from "@/lib/demo-staging/format";
import { getDeploymentsByProjectId } from "@/lib/demo-staging/queries";
import { getProjectBySlug } from "@/lib/projects/queries";

export const metadata: Metadata = {
  title: "Project Deployments | MintChipOS",
};

type ProjectDeploymentsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDeploymentsPage({
  params,
}: ProjectDeploymentsPageProps) {
  await requireUser();

  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const deployments = await getDeploymentsByProjectId(project.id);

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to {formatField(project.name)}
          </Link>

          <div className="mt-6">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Deployments
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Preview and production deployment records for this project.
            </p>
          </div>

          <div className="mt-8">
            {deployments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  No deployments yet.
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Generated website demos will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {deployments.map((deployment) => (
                    <li key={deployment.id} className="px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                              {formatDeploymentType(deployment.deployment_type)}
                            </span>
                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                              {formatDeploymentStatus(deployment.status)}
                            </span>
                            {deployment.is_current ? (
                              <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                                Current
                              </span>
                            ) : deployment.superseded_at ? (
                              <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                Superseded
                              </span>
                            ) : null}
                          </div>

                          {deployment.preview_url ? (
                            <a
                              href={deployment.preview_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:decoration-zinc-100"
                            >
                              {deployment.preview_url}
                            </a>
                          ) : (
                            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                              No preview URL yet.
                            </p>
                          )}

                          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            {deployment.provider} ·{" "}
                            {formatPreviewVisibility(
                              deployment.preview_visibility,
                            )}{" "}
                            · v{deployment.version} ·{" "}
                            {deployment.build_id ??
                              deployment.source_commit ??
                              "no source identifier"}
                          </p>

                          {deployment.deployment_type === "PREVIEW" ? (
                            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                              Preview demo — this is not the business&apos;s live
                              website.
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                          <p>Created {formatDate(deployment.created_at)}</p>
                          <p>Deployed {formatDate(deployment.deployed_at)}</p>
                        </div>
                      </div>

                      {deployment.failure_reason ? (
                        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                          {deployment.failure_reason}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

