"use client";

import { useActionState } from "react";
import { createPlaybookBrief, initialCreatePlaybookBriefState } from "./actions";

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300";

type NewPlaybookBriefFormProps = {
  projects: { id: string; name: string }[];
};

export default function NewPlaybookBriefForm({
  projects,
}: NewPlaybookBriefFormProps) {
  const [state, formAction, pending] = useActionState(
    createPlaybookBrief,
    initialCreatePlaybookBriefState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="project_id" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Project
        </label>
        <select id="project_id" name="project_id" required defaultValue="" className={inputClasses}>
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
          <p className="mt-1.5 text-sm text-red-600">{state.fieldErrors.project_id}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="industry_name" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Industry name
        </label>
        <input
          id="industry_name"
          name="industry_name"
          type="text"
          required
          placeholder="AI Website Design"
          className={inputClasses}
        />
        {state.fieldErrors.industry_name ? (
          <p className="mt-1.5 text-sm text-red-600">{state.fieldErrors.industry_name}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="industry_subtype" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Industry subtype / niche
        </label>
        <input
          id="industry_subtype"
          name="industry_subtype"
          type="text"
          placeholder="Managed Website Service"
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} className={`${inputClasses} resize-y`} />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Creating..." : "Create Playbook Brief"}
      </button>
    </form>
  );
}
