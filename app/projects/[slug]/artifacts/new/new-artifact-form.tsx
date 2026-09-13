"use client";

import { useActionState } from "react";
import { ARTIFACT_TYPE_OPTIONS } from "@/lib/artifacts/constants";
import { createArtifact } from "./actions";
import { initialCreateArtifactFormState } from "./types";

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300";

type NewArtifactFormProps = {
  projectId: string;
  projectSlug: string;
};

export default function NewArtifactForm({
  projectId,
  projectSlug,
}: NewArtifactFormProps) {
  const [state, formAction, pending] = useActionState(
    createArtifact,
    initialCreateArtifactFormState,
  );

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="project_slug" value={projectSlug} />

      <div>
        <label
          htmlFor="artifact_type"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Artifact Type
        </label>
        <select
          id="artifact_type"
          name="artifact_type"
          required
          defaultValue=""
          className={inputClasses}
        >
          <option value="" disabled>
            Select an artifact type
          </option>
          {ARTIFACT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors.artifact_type ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.artifact_type}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          autoComplete="off"
          required
          className={inputClasses}
        />
        {state.fieldErrors.title ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Initial Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={8}
          required
          className={`${inputClasses} resize-y`}
        />
        {state.fieldErrors.content ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.content}
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
        {pending ? "Creating..." : "Create Artifact"}
      </button>
    </form>
  );
}
