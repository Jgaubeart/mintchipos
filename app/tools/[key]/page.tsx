import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatJson } from "@/lib/agents/format";
import { formatToolRiskLevel } from "@/lib/capabilities/format";
import { getToolByKey } from "@/lib/capabilities/queries";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Tool | MintChipOS",
};

type ToolDetailPageProps = {
  params: Promise<{ key: string }>;
};

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  await requireUser();

  const { key } = await params;
  const tool = await getToolByKey(key);

  if (!tool) {
    notFound();
  }

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Tools
          </Link>

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {tool.key}
                </span>
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {formatToolRiskLevel(tool.risk_level)}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {tool.name}
              </h1>
              {tool.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {tool.description}
                </p>
              ) : null}
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Execution category
                  </p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {tool.execution_category ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Active
                  </p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {tool.active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              {tool.configuration_schema ? (
                <div className="mt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Configuration schema
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs leading-5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {formatJson(tool.configuration_schema)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
