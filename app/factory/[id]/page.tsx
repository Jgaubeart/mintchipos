import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import {
  WEBSITE_FACTORY_STAGE_LABELS,
  type WebsiteFactoryStage,
} from "@/lib/website-factory/constants";
import { getWebsiteFactoryRunById } from "@/lib/website-factory/queries";

export const metadata: Metadata = {
  title: "Website Factory Run | MintChipOS",
};

type FactoryRunDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FactoryRunDetailPage({
  params,
}: FactoryRunDetailPageProps) {
  await requireUser();

  const { id } = await params;
  const run = await getWebsiteFactoryRunById(id);

  if (!run) {
    notFound();
  }

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/factory"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Website Factory
          </Link>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                {run.status}
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                {run.progress}%
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {run.business_name ?? run.website_url}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {run.website_url}
            </p>

            {run.preview_url ? (
              <a
                href={run.preview_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:decoration-zinc-100"
              >
                {run.preview_url}
              </a>
            ) : null}

            {run.failure_reason ? (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {run.failure_reason}
              </p>
            ) : null}
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Pipeline progress
            </h2>

            <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {(run.stages ?? []).map((stage) => {
                  const stageKey = String(stage.stage ?? "") as WebsiteFactoryStage;
                  const label =
                    WEBSITE_FACTORY_STAGE_LABELS[stageKey] ?? stageKey;
                  return (
                    <li
                      key={stageKey}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {label}
                        </p>
                        {stage.message ? (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {String(stage.message)}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        {String(stage.status)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
