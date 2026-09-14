"use client";

import { useActionState } from "react";
import { generateDemo } from "./actions";
import { initialGenerateDemoFormState } from "./types";

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300";

export default function FactoryForm() {
  const [state, formAction, pending] = useActionState(
    generateDemo,
    initialGenerateDemoFormState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="project_slug" value="mint-chip-website" />

      <div>
        <label
          htmlFor="website_url"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Website URL
        </label>
        <input
          id="website_url"
          name="website_url"
          type="text"
          placeholder="https://mintchipweb.com"
          required
          className={inputClasses}
        />
        {state.fieldErrors.websiteUrl ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.websiteUrl}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="business_name"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Business name
        </label>
        <input
          id="business_name"
          name="business_name"
          type="text"
          placeholder="Optional"
          className={inputClasses}
        />
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          Only needed when the website cannot reliably identify the business.
        </p>
        {state.fieldErrors.businessName ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.businessName}
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
        {pending ? "Generating..." : "Generate Demo"}
      </button>
    </form>
  );
}

