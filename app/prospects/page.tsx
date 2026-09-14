import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import {
  formatField,
  formatProspectStatus,
} from "@/lib/prospecting/format";
import {
  getProspects,
  getProspectSummary,
} from "@/lib/prospecting/queries";

export const metadata: Metadata = {
  title: "Prospects | MintChipOS",
};

export default async function ProspectsPage() {
  await requireUser();

  const [summary, recentProspects] = await Promise.all([
    getProspectSummary(),
    getProspects({ limit: 10 }),
  ]);

  const stats = [
    { label: "Total prospects", value: summary.total },
    { label: "Qualified", value: summary.qualified },
    { label: "Disqualified", value: summary.disqualified },
    { label: "Audit pending", value: summary.auditPending },
  ];

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Prospects
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Autonomous prospect discovery and qualification.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/prospects/scans"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Scan history
              </Link>
              <Link
                href="/prospects/scans/new"
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                New Scan
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <section className="mt-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Recent prospects
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Highest-scoring records first.
                </p>
              </div>
              <Link
                href="/prospects/scans/new"
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Start a scan →
              </Link>
            </div>

            <div className="mt-5">
              {recentProspects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    No prospects yet.
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Create a scan to begin discovering prospects.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {recentProspects.map((prospect) => (
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
