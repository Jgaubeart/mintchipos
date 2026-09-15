import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import {
  formatDate,
} from "@/lib/demo-staging/format";
import {
  getOrchestratorMessages,
  getOrchestratorTasks,
  getOrchestratorThreads,
} from "@/lib/orchestrator/queries";
import { sendOrchestratorMessage } from "./actions";

export const metadata: Metadata = {
  title: "Orchestrator | MintChipOS",
};

type OrchestratorPageProps = {
  searchParams?: Promise<{ thread?: string; error?: string }>;
};

export default async function OrchestratorPage({
  searchParams,
}: OrchestratorPageProps) {
  await requireUser();
  const search = await searchParams;
  const threads = await getOrchestratorThreads();
  const activeThreadId = search?.thread ?? threads[0]?.id ?? null;
  const messages = activeThreadId
    ? await getOrchestratorMessages(activeThreadId)
    : [];
  const tasks = activeThreadId
    ? await getOrchestratorTasks(activeThreadId)
    : [];

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Conversations
              </h2>
              <Link
                href="/orchestrator"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                New
              </Link>
            </div>

            <ul className="mt-4 space-y-2">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/orchestrator?thread=${thread.id}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                      thread.id === activeThreadId
                        ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50"
                        : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <span className="block truncate">{thread.title}</span>
                    <span className="mt-0.5 block text-xs text-zinc-400">
                      {formatDate(thread.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <section className="flex min-h-[70vh] flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-900">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Orchestrator
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Talk to MintChipOS. I route work to the Website Factory.
              </p>
            </div>

            {search?.error ? (
              <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
                {search.error}
              </p>
            ) : null}

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-48 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                  Ask MintChipOS to do something.
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "USER"
                        ? "ml-auto bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : message.role === "SYSTEM_EVENT"
                          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                          : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === "ORCHESTRATOR" &&
                    Array.isArray(message.metadata.actions) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(
                          message.metadata.actions as Array<{
                            label: string;
                            href: string;
                            kind?: string;
                          }>
                        ).map((action) => (
                          <a
                            key={`${action.label}-${action.href}`}
                            href={action.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          >
                            {action.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}

              {tasks.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {task.intent.replace(/_/g, " ")}
                        </p>
                        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                          {task.status}
                        </span>
                      </div>
                      {task.factory_run_id ? (
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          Run: {task.factory_run_id}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <form
              action={sendOrchestratorMessage}
              className="border-t border-zinc-100 p-4 dark:border-zinc-900"
            >
              {activeThreadId ? (
                <input type="hidden" name="thread_id" value={activeThreadId} />
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <textarea
                  name="content"
                  rows={2}
                  required
                  placeholder="Ask MintChipOS to do something..."
                  className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
