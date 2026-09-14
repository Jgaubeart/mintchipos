import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import ScanForm from "./scan-form";

export const metadata: Metadata = {
  title: "New Prospect Scan | MintChipOS",
};

export default async function NewProspectScanPage() {
  await requireUser();

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/prospects/scans"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Scans
          </Link>

          <div className="mt-6 max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              New Scan
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              The system does the discovery work.
            </p>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
              <ScanForm />
            </div>

            <p className="mt-4 text-xs leading-5 text-zinc-400 dark:text-zinc-500">
              No authorized live discovery provider is configured yet, so this
              workflow uses deterministic fixtures and clearly labels them as
              fixture data.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

