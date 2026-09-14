import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import {
  formatDate,
  formatField,
  formatProspectStatus,
  formatScanStatus,
} from "@/lib/prospecting/format";
import {
  getProspects,
  getProspectScanById,
} from "@/lib/prospecting/queries";
import { runScan } from "./actions";

export const metadata: Metadata = {
  title: "Prospect Scan | MintChipOS",
};

type ProspectScanDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; ok?: string }>;
};

export default async function ProspectScanDetailPage({
  params,
  searchParams,
}: ProspectScanDetailPageProps) {
  await requireUser();

  const { id } = await params;
  const search = await searchParams;
  const scan = await getProspectScanById(id);

  if (!scan) {
    notFound();
  }

  const prospects = await getProspects({ scanId: scan.id });
  const counters = [
    { label: "Discovered", value: scan.discovered_count },
    { label: "Audited", value: scan.audited_count },
    { label: "Qualified", value: scan.qualified_count },
    { label: "Disqualified", value: scan.disqualified_count },
    { label: "Errors", value: scan.error_count },
  ];

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <Link
            href="/prospects/scans"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Scans
          </Link>

          {search?.error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              {search.error}
            </p>
          ) : null}

          {search?.ok ? (
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
              {search.ok}
            </p>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {formatScanStatus(scan.status)}
                </span>
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  Fixture provider
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {formatField(scan.location)}
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {scan.industries.length > 0
                  ? scan.industries.join(", ")
                  : "No industries"}{" "}
                · max {scan.max_prospects} · created{" "}
                {formatDate(scan.created_at)}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <form action={runScan}>
                  <input type="hidden" name="scan_id" value={scan.id} />
                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    Run again
                  </button>
                </form>
                <Link
                  href="/prospects/scans/new"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  New Scan
                </Link>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 lg:grid-cols-5 sm:p-8">
              {counters.map((counter) => (
                <div
                  key={counter.label}
                  className="rounded-xl border border-zinc-100 p-4 dark:border-zinc-900"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {counter.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    {counter.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Scan results
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Businesses discovered in this scan.
            </p>

            <div className="mt-5">
              {prospects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    No prospect results.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {prospects.map((prospect) => (
                      <li key={prospect.id}>
                        <Link
                          href={`/prospects/${prospect.id}`}
                          className="flex flex-col gap-2 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {formatField(prospect.business_name)}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              {formatField(prospect.industry)} ·{" "}
                              {[prospect.city, prospect.state]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <span>
                              {prospect.website_url ? "Website" : "No website"}
                            </span>
                            <span aria-hidden="true">/</span>
                            <span>
                              Opp {prospect.website_opportunity_score}
                            </span>
                            <span aria-hidden="true">/</span>
                            <span>Score {prospect.qualification_score}</span>
                            <span aria-hidden="true">/</span>
                            <span>
                              {formatProspectStatus(prospect.prospect_status)}
                            </span>
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

