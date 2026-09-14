import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import {
  formatDate,
  formatField,
  formatScanStatus,
} from "@/lib/prospecting/format";
import { getProspectScans } from "@/lib/prospecting/queries";

export const metadata: Metadata = {
  title: "Prospect Scans | MintChipOS",
};

export default async function ProspectScansPage() {
  await requireUser();
  const scans = await getProspectScans();

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/prospects"
                className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                ← Back to Prospects
              </Link>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Prospect Scans
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Geographic discovery jobs and their outcomes.
              </p>
            </div>
            <Link
              href="/prospects/scans/new"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              New Scan
            </Link>
          </div>

          {scans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No scans found.
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create a new scan to begin prospecting.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {scans.map((scan) => (
                  <li key={scan.id}>
                    <Link
                      href={`/prospects/scans/${scan.id}`}
                      className="flex flex-col gap-3 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {formatField(scan.location)}
                          </p>
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                            {formatScanStatus(scan.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {scan.industries.length > 0
                            ? scan.industries.join(", ")
                            : "No industries"} · max {scan.max_prospects}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>{scan.discovered_count} found</span>
                        <span aria-hidden="true">/</span>
                        <span>{scan.qualified_count} qualified</span>
                        <span aria-hidden="true">/</span>
                        <span>{formatDate(scan.created_at)}</span>
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

