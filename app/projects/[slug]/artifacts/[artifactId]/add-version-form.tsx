"use client";

import { useActionState } from "react";
import { addArtifactVersion } from "./actions";
import { initialAddArtifactVersionFormState } from "./types";

const textareaClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300 resize-y";

type AddVersionFormProps = {
  projectSlug: string;
  artifactId: string;
};

export default function AddVersionForm({
  projectSlug,
  artifactId,
}: AddVersionFormProps) {
  const [state, formAction, pending] = useActionState(
    addArtifactVersion,
    initialAddArtifactVersionFormState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="project_slug" value={projectSlug} />
      <input type="hidden" name="artifact_id" value={artifactId} />

      <div>
        <label
          htmlFor="content"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          New Version Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={8}
          required
          className={textareaClasses}
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
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Saving..." : "Save Version"}
      </button>
    </form>
  );
}
