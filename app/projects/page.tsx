import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { formatField } from "@/lib/projects/format";
import { getProjects } from "@/lib/projects/queries";

export const metadata: Metadata = {
  title: "Projects | MintChipOS",
};

export default async function ProjectsPage() {
  await requireUser();
  const projects = await getProjects();

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Projects
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Read-only project records from Supabase.
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No projects found.
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Projects created in Supabase will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="flex flex-col gap-2 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {formatField(project.name)}
                          </span>
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                            {formatField(project.project_number)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {formatField(project.project_type)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>{formatField(project.lifecycle_status)}</span>
                        <span aria-hidden="true">/</span>
                        <span>{formatField(project.production_stage)}</span>
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
