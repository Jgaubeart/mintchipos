import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";

export default function ProjectNotFound() {
  return (
    <>
      <ProtectedNav />
      <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            MintChipOS
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Project not found
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            The project you are looking for does not exist.
          </p>
          <Link
            href="/projects"
            className="mt-8 inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Back to Projects
          </Link>
        </div>
      </main>
    </>
  );
}
