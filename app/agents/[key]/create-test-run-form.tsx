"use client";

import { useActionState } from "react";
import { createTestRun } from "./actions";
import { initialCreateTestRunFormState } from "./types";

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300";

type CreateTestRunFormProps = {
  agentDefinitionId: string;
  projects: {
    id: string;
    name: string;
  }[];
};

export default function CreateTestRunForm({
  agentDefinitionId,
  projects,
}: CreateTestRunFormProps) {
  const [state, formAction, pending] = useActionState(
    createTestRun,
    initialCreateTestRunFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input
        type="hidden"
        name="agent_definition_id"
        value={agentDefinitionId}
      />

      <div>
        <label
          htmlFor="project_id"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Project
        </label>
        <select
          id="project_id"
          name="project_id"
          required
          defaultValue=""
          className={inputClasses}
        >
          <option value="" disabled>
            Select a project
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {state.fieldErrors.project_id ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.project_id}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="input"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Input
        </label>
        <textarea
          id="input"
          name="input"
          required
          rows={4}
          placeholder="Enter the instruction or request for this agent..."
          className={inputClasses}
        />
        {state.fieldErrors.input ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.input}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Creating..." : "Create Test Run"}
      </button>
    </form>
  );
}
