import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { getProjects } from "@/lib/projects/queries";
import NewPlaybookBriefForm from "./brief-form";

export const metadata: Metadata = {
  title: "New Playbook Brief | MintChipOS",
};

export default async function NewPlaybookBriefPage() {
  await requireUser();

  const projects = await getProjects();

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
          <Link
            href="/playbooks"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Playbooks
          </Link>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            New Playbook Brief
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Define a research assignment for an industry. You will review it
            before running research.
          </p>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
            <NewPlaybookBriefForm
              projects={projects.map((project) => ({
                id: project.id,
                name: project.name,
              }))}
            />
          </div>
        </div>
      </main>
    </>
  );
}
