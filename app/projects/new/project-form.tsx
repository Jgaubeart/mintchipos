"use client";

import { useActionState } from "react";
import { PROJECT_TYPE_OPTIONS } from "@/lib/projects/constants";
import { createProject } from "./actions";
import { initialCreateProjectFormState } from "./types";

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300";

export default function ProjectForm() {
  const [state, formAction, pending] = useActionState(
    createProject,
    initialCreateProjectFormState,
  );

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Project Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          required
          className={inputClasses}
        />
        {state.fieldErrors.name ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="project_type"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Project Type
        </label>
        <select
          id="project_type"
          name="project_type"
          required
          defaultValue=""
          className={inputClasses}
        >
          <option value="" disabled>
            Select a project type
          </option>
          {PROJECT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors.project_type ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.project_type}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className={`${inputClasses} resize-y`}
        />
        {state.fieldErrors.description ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.description}
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
        {pending ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}
