import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import {
  formatDate,
  formatDiscoverySource,
  formatField,
  formatProspectStatus,
} from "@/lib/prospecting/format";
import { getProspectById } from "@/lib/prospecting/queries";

export const metadata: Metadata = {
  title: "Prospect | MintChipOS",
};

type ProspectDetailPageProps = {
  params: Promise<{ id: string }>;
};

function detailItems(
  rows: Array<{ label: string; value: string | number | null | undefined }>,
) {
  return rows.map((row) => (
    <div key={row.label}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {row.label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {formatField(row.value === null || row.value === undefined ? null : String(row.value))}
      </dd>
    </div>
  ));
}

function ReasonList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProspectDetailPage({
  params,
}: ProspectDetailPageProps) {
  await requireUser();

  const { id } = await params;
  const prospect = await getProspectById(id);

  if (!prospect) {
    notFound();
  }

  const businessDetails = detailItems([
    { label: "Industry", value: prospect.industry },
    { label: "Subtype", value: prospect.industry_subtype },
    { label: "Location", value: [prospect.city, prospect.state, prospect.country].filter(Boolean).join(", ") },
    { label: "Address", value: prospect.address },
    { label: "Phone", value: prospect.phone },
    { label: "Public email", value: prospect.public_email },
    { label: "Review count", value: prospect.review_count },
    { label: "Rating", value: prospect.rating },
    { label: "Locations", value: prospect.location_count },
  ]);

  const websiteDetails = detailItems([
    { label: "Website", value: prospect.website_url ?? "No website" },
    { label: "Reachable", value: prospect.website_reachable ? "Yes" : "No" },
    { label: "HTTPS", value: prospect.https_present ? "Yes" : "No" },
    { label: "Mobile viewport", value: prospect.mobile_responsive === null ? "Not measured" : prospect.mobile_responsive ? "Yes" : "No" },
    { label: "Page estimate", value: prospect.page_count_estimate },
    { label: "Contact CTA", value: prospect.contact_cta_present ? "Yes" : "No" },
    { label: "Phone CTA", value: prospect.phone_cta_present ? "Yes" : "No" },
    { label: "Contact form", value: prospect.contact_form_present ? "Yes" : "No" },
    { label: "Portfolio", value: prospect.portfolio_present ? "Yes" : "No" },
    { label: "Testimonials", value: prospect.testimonials_present ? "Yes" : "No" },
  ]);

  const scores = [
    { label: "Qualification", value: prospect.qualification_score },
    { label: "Business quality", value: prospect.business_quality_score },
    { label: "Website opportunity", value: prospect.website_opportunity_score },
    { label: "Contactability", value: prospect.contactability_score },
  ];

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <Link
            href="/prospects"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Prospects
          </Link>

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 p-6 dark:border-zinc-900 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {formatProspectStatus(prospect.prospect_status)}
                </span>
                <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {formatDiscoverySource(prospect.discovery_source)}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {formatField(prospect.business_name)}
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {prospect.business_description ?? "No business description provided."}
              </p>
              {prospect.website_url ? (
                <a
                  href={prospect.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:decoration-zinc-100"
                >
                  {prospect.website_url}
                </a>
              ) : (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  No website detected.
                </p>
              )}
            </div>

            <div className="grid gap-4 border-b border-zinc-100 p-6 dark:border-zinc-900 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
              {scores.map((score) => (
                <div
                  key={score.label}
                  className="rounded-xl border border-zinc-100 p-4 dark:border-zinc-900"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {score.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    {score.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Business information
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {businessDetails}
                </dl>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Website signals
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {websiteDetails}
                </dl>
              </div>
            </div>

            <div className="grid gap-8 border-t border-zinc-100 p-6 dark:border-zinc-900 sm:p-8 lg:grid-cols-2">
              <ReasonList
                title="Qualification reasons"
                items={prospect.qualification_reasons}
              />
              <ReasonList
                title="Disqualification reasons"
                items={prospect.disqualification_reasons}
              />
            </div>

            <div className="grid gap-8 border-t border-zinc-100 p-6 dark:border-zinc-900 sm:p-8 lg:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Audit evidence
                </h2>
                <ul className="mt-3 space-y-2">
                  {(prospect.audit_notes ?? []).length === 0 ? (
                    <li className="text-sm text-zinc-500 dark:text-zinc-400">
                      No audit notes.
                    </li>
                  ) : (
                    prospect.audit_notes.map((note) => (
                      <li
                        key={note}
                        className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        {note}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Provenance
                </h2>
                <dl className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Source
                    </dt>
                    <dd>{formatDiscoverySource(prospect.discovery_source)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Source URL
                    </dt>
                    <dd>{prospect.source_url ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Discovered
                    </dt>
                    <dd>{formatDate(prospect.discovered_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Last audit
                    </dt>
                    <dd>{formatDate(prospect.audit_timestamp)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-400 dark:text-zinc-500">
            Future milestones will hand qualified prospects to the Industry
            Playbook, Business Research, Design Direction Brief, and Website
            Generation pipeline. No outreach or demo generation is implemented
            in this workstream.
          </p>
        </div>
      </main>
    </>
  );
}

