import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { getProjectBySlug } from "@/lib/projects/queries";
import NewArtifactForm from "./new-artifact-form";

export const metadata: Metadata = {
  title: "New Artifact | MintChipOS",
};

type NewArtifactPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewArtifactPage({
  params,
}: NewArtifactPageProps) {
  await requireUser();

  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

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

          <div className="mt-6 max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              New Artifact
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create the initial version of a project artifact.
            </p>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
              <NewArtifactForm
                projectId={project.id}
                projectSlug={project.slug}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
