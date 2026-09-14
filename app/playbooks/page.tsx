import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/projects/format";
import { listPlaybookBriefs } from "@/lib/playbooks/queries";

export const metadata: Metadata = {
  title: "Playbooks | MintChipOS",
};

export default async function PlaybooksPage() {
  await requireUser();

  const briefs = await listPlaybookBriefs();

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Playbooks
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Reusable industry website playbooks, generated from research.
              </p>
            </div>
            <Link
              href="/playbooks/new"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              New Playbook Brief
            </Link>
          </div>

          <div className="mt-8">
            {briefs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  No playbook briefs yet.
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Create a playbook brief to define a research assignment.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {briefs.map((brief) => (
                    <li key={brief.id}>
                      <Link
                        href={`/playbooks/${brief.id}`}
                        className="flex flex-col gap-2 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {brief.title}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {brief.project_name}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                          <span>{formatDate(brief.updated_at)}</span>
                        </div>
                      </Link>
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
