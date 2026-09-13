import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import {
  formatPermissionLevel,
  formatToolRiskLevel,
} from "@/lib/capabilities/format";
import { TOOL_PERMISSION_LEVEL_OPTIONS } from "@/lib/capabilities/constants";
import {
  getAgentSkillAssignments,
  getAgentToolAssignments,
  getSkills,
  getTools,
} from "@/lib/capabilities/queries";
import {
  getAgentDefinitionByKey,
  getAgentDefinitionVersions,
} from "@/lib/agents/queries";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/projects/format";
import { getProjects } from "@/lib/projects/queries";
import {
  assignSkill,
  assignTool,
  disableSkillAssignment,
  disableToolAssignment,
  enableSkillAssignment,
  enableToolAssignment,
  removeSkillAssignment,
  removeToolAssignment,
} from "./assignment-actions";
import CreateTestRunForm from "./create-test-run-form";

export const metadata: Metadata = {
  title: "Agent | MintChipOS",
};

type AgentDetailPageProps = {
  params: Promise<{ key: string }>;
  searchParams?: Promise<{ error?: string; ok?: string }>;
};

export default async function AgentDetailPage({
  params,
  searchParams,
}: AgentDetailPageProps) {
  await requireUser();

  const { key } = await params;
  const search = await searchParams;
  const definition = await getAgentDefinitionByKey(key);

  if (!definition) {
    notFound();
  }

  const [versions, projects, skillAssignments, toolAssignments, skills, tools] =
    await Promise.all([
      getAgentDefinitionVersions(definition.id),
      getProjects(),
      getAgentSkillAssignments(definition.id),
      getAgentToolAssignments(definition.id),
      getSkills(),
      getTools(),
    ]);

  const currentVersion = versions.find(
    (version) => version.id === definition.current_version_id,
  );

  const assignedSkillIds = new Set(
    skillAssignments.map((assignment) => assignment.skill_id),
  );
  const assignedToolIds = new Set(
    toolAssignments.map((assignment) => assignment.tool_id),
  );
  const unassignedSkills = skills.filter((skill) => !assignedSkillIds.has(skill.id));
  const unassignedTools = tools.filter((tool) => !assignedToolIds.has(tool.id));

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Agents
          </Link>

          {search?.error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              {search.error}
            </p>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {definition.key}
                </span>
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {definition.active ? "Active" : "Inactive"}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {definition.name}
              </h1>
              {definition.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {definition.description}
                </p>
              ) : null}
              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Current version
                  </p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">
                    v{currentVersion?.version ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Model policy key
                  </p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {currentVersion?.model_policy_key ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Current Instructions
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {currentVersion?.instructions ?? "No instructions."}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Version History
              </h2>

              <div className="mt-5 space-y-3">
                {versions.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No versions yet.
                  </p>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Version {version.version}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDate(version.created_at)}
                        </p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {version.instructions}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Skills
            </h2>

            <form action={assignSkill} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="hidden"
                name="agent_definition_id"
                value={definition.id}
              />
              <input type="hidden" name="agent_key" value={definition.key} />
              <select
                name="skill_id"
                required
                defaultValue=""
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:flex-1"
              >
                <option value="" disabled>
                  Select a skill
                </option>
                {unassignedSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Assign Skill
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {skillAssignments.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No skills assigned.
                </p>
              ) : (
                skillAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {assignment.skill_name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {assignment.skill_key} · v
                          {assignment.current_version_number ?? "—"} ·{" "}
                          {assignment.required ? "Required" : "Optional"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {assignment.enabled ? "Enabled" : "Disabled"}
                        </span>
                        {assignment.enabled ? (
                          <form action={disableSkillAssignment}>
                            <input
                              type="hidden"
                              name="assignment_id"
                              value={assignment.id}
                            />
                            <input
                              type="hidden"
                              name="agent_key"
                              value={definition.key}
                            />
                            <button
                              type="submit"
                              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                            >
                              Disable
                            </button>
                          </form>
                        ) : (
                          <form action={enableSkillAssignment}>
                            <input
                              type="hidden"
                              name="assignment_id"
                              value={assignment.id}
                            />
                            <input
                              type="hidden"
                              name="agent_key"
                              value={definition.key}
                            />
                            <button
                              type="submit"
                              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                            >
                              Enable
                            </button>
                          </form>
                        )}
                        <form action={removeSkillAssignment}>
                          <input
                            type="hidden"
                            name="assignment_id"
                            value={assignment.id}
                          />
                          <input
                            type="hidden"
                            name="agent_key"
                            value={definition.key}
                          />
                          <button
                            type="submit"
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Tools
            </h2>

            <form action={assignTool} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="hidden"
                name="agent_definition_id"
                value={definition.id}
              />
              <input type="hidden" name="agent_key" value={definition.key} />
              <select
                name="tool_id"
                required
                defaultValue=""
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:flex-1"
              >
                <option value="" disabled>
                  Select a tool
                </option>
                {unassignedTools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))}
              </select>
              <select
                name="permission_level"
                required
                defaultValue=""
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:w-40"
              >
                <option value="" disabled>
                  Permission
                </option>
                {TOOL_PERMISSION_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Assign Tool
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {toolAssignments.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No tools assigned.
                </p>
              ) : (
                toolAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {assignment.tool_name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {assignment.tool_key} ·{" "}
                          {formatToolRiskLevel(assignment.risk_level)} ·{" "}
                          {formatPermissionLevel(assignment.permission_level)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {assignment.enabled ? "Enabled" : "Disabled"}
                        </span>
                        {assignment.enabled ? (
                          <form action={disableToolAssignment}>
                            <input
                              type="hidden"
                              name="assignment_id"
                              value={assignment.id}
                            />
                            <input
                              type="hidden"
                              name="agent_key"
                              value={definition.key}
                            />
                            <button
                              type="submit"
                              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                            >
                              Disable
                            </button>
                          </form>
                        ) : (
                          <form action={enableToolAssignment}>
                            <input
                              type="hidden"
                              name="assignment_id"
                              value={assignment.id}
                            />
                            <input
                              type="hidden"
                              name="agent_key"
                              value={definition.key}
                            />
                            <button
                              type="submit"
                              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                            >
                              Enable
                            </button>
                          </form>
                        )}
                        <form action={removeToolAssignment}>
                          <input
                            type="hidden"
                            name="assignment_id"
                            value={assignment.id}
                          />
                          <input
                            type="hidden"
                            name="agent_key"
                            value={definition.key}
                          />
                          <button
                            type="submit"
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Create Test Run
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Records a pending manual execution record. No model is invoked.
            </p>
            <div className="mt-4">
              <CreateTestRunForm
                agentDefinitionId={definition.id}
                projects={projects.map((project) => ({
                  id: project.id,
                  name: project.name,
                }))}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
