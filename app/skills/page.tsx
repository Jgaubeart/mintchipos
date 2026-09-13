import type { Metadata } from "next";
import Link from "next/link";
import { getSkills } from "@/lib/capabilities/queries";
import { formatSkillSourceType } from "@/lib/capabilities/format";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/projects/format";

export const metadata: Metadata = {
  title: "Skills | MintChipOS",
};

export default async function SkillsPage() {
  await requireUser();
  const skills = await getSkills();

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Skills
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Reusable instructions and knowledge.
            </p>
          </div>

          {skills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No skills found.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {skills.map((skill) => (
                  <li key={skill.id}>
                    <Link
                      href={`/skills/${skill.key}`}
                      className="flex flex-col gap-2 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {skill.name}
                          </span>
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                            {skill.key}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {skill.active ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>v{skill.current_version_number ?? "—"}</span>
                        <span aria-hidden="true">/</span>
                        <span>{formatSkillSourceType(skill.source_type ?? "—")}</span>
                        <span aria-hidden="true">/</span>
                        <span>{formatDate(skill.updated_at)}</span>
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
