import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import {
  formatDate,
  formatField,
} from "@/lib/demo-staging/format";
import {
  getWebsiteFactoryRuns,
} from "@/lib/website-factory/queries";
import FactoryForm from "./factory-form";

export const metadata: Metadata = {
  title: "Website Factory | MintChipOS",
};

export default async function WebsiteFactoryPage() {
  await requireUser();
  const runs = await getWebsiteFactoryRuns();

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Website Factory
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              URL in, QA-passed preview URL out.
            </p>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
              <FactoryForm />
            </div>
          </div>

          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Recent factory runs
            </h2>

            <div className="mt-5">
              {runs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    No factory runs yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {runs.map((run) => (
                      <li key={run.id}>
                        <Link
                          href={`/factory/${run.id}`}
                          className="flex flex-col gap-2 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {formatField(run.business_name ?? run.website_url)}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              {run.website_url} · {run.progress}%
                            </p>
                          </div>
                          <div className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                            <span>{run.status}</span>
                            <span aria-hidden="true"> / </span>
                            <span>{formatDate(run.created_at)}</span>
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

