"use client";

import { useActionState } from "react";
import { createProspectScan } from "./actions";
import { initialCreateProspectScanFormState } from "./types";

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300";

export default function ScanForm() {
  const [state, formAction, pending] = useActionState(
    createProspectScan,
    initialCreateProspectScanFormState,
  );

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div>
        <label
          htmlFor="location"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          placeholder="Cape Coral, FL"
          required
          className={inputClasses}
        />
        {state.fieldErrors.location ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.location}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="industries"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Industry / category
        </label>
        <input
          id="industries"
          name="industries"
          type="text"
          placeholder="Roofing, Landscaping"
          required
          className={inputClasses}
        />
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          Separate multiple industries with commas.
        </p>
        {state.fieldErrors.industries ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.industries}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="max_prospects"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Maximum prospects
        </label>
        <input
          id="max_prospects"
          name="max_prospects"
          type="number"
          min={1}
          max={250}
          defaultValue={100}
          required
          className={inputClasses}
        />
        {state.fieldErrors.maxProspects ? (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.maxProspects}
          </p>
        ) : null}
      </div>

      <details className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Advanced settings
        </summary>
        <div className="mt-4 space-y-5">
          <div>
            <label
              htmlFor="radius_km"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Radius (km)
            </label>
            <input
              id="radius_km"
              name="radius_km"
              type="number"
              min={0.1}
              step="any"
              placeholder="Optional"
              className={inputClasses}
            />
            {state.fieldErrors.radiusKm ? (
              <p className="mt-1.5 text-sm text-red-600">
                {state.fieldErrors.radiusKm}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="exclusions"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Exclusions
            </label>
            <textarea
              id="exclusions"
              name="exclusions"
              rows={3}
              placeholder="National chains, already contacted, etc."
              className={`${inputClasses} resize-y`}
            />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Separate exclusions with commas.
            </p>
          </div>
        </div>
      </details>

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
        {pending ? "Scanning..." : "Start Scanning"}
      </button>
    </form>
  );
}

