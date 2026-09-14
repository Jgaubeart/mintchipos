import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedNav } from "@/components/protected-nav";
import { requireUser } from "@/lib/auth/require-user";
import { normalizeDesignBrief } from "@/lib/design-brief/defaults";
import {
  getDesignBriefArtifact,
  getDesignBriefVersions,
} from "@/lib/design-brief/queries";
import type {
  DesignBrief,
  DesignBriefProject,
} from "@/lib/design-brief/types";
import { getProjectBySlug } from "@/lib/projects/queries";
import DesignBriefEditor from "../editor";

export const metadata: Metadata = {
  title: "Edit Design Direction Brief | MintChipOS",
};

type EditDesignBriefPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditDesignBriefPage({
  params,
}: EditDesignBriefPageProps) {
  await requireUser();

  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const artifact = await getDesignBriefArtifact(project.id);
  const versions = artifact ? await getDesignBriefVersions(artifact.id) : [];
  const current = versions[0]?.structured_data;
  const initialBrief = isDesignBrief(current)
    ? normalizeDesignBrief(current)
    : null;

  const projectContext: DesignBriefProject = {
    id: project.id,
    slug: project.slug,
    name: project.name,
    project_number: project.project_number,
    project_type: project.project_type,
    lifecycle_status: project.lifecycle_status,
    production_stage: project.production_stage,
    description: project.description,
  };

  return (
    <>
      <ProtectedNav />
      <main className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href={`/projects/${project.slug}/design-brief`}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true">←</span>
            Back to Design Direction Brief
          </Link>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Design Direction Brief
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            A guided brief for {project.name}. Changes are autosaved locally as
            a draft until you save a version.
          </p>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
            <DesignBriefEditor
              project={projectContext}
              initialBrief={initialBrief}
            />
          </div>
        </div>
      </main>
    </>
  );
}

function isDesignBrief(value: unknown): value is DesignBrief {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { schemaVersion?: unknown }).schemaVersion === 1
  );
}
