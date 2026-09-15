"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getProjectBySlug } from "@/lib/projects/queries";
import {
  persistFactoryPreviewDeployment,
  persistWebsiteFactoryRun,
} from "@/lib/website-factory/queries";
import { getWebsiteFactoryAgentRuntime } from "@/lib/website-factory/agents";
import { runWebsiteFactoryPipeline } from "@/lib/website-factory/pipeline";
import { HttpResearchProvider } from "@/lib/website-factory/research";
import type { GenerateDemoFormState } from "./types";

function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function generateDemo(
  _previousState: GenerateDemoFormState,
  formData: FormData,
): Promise<GenerateDemoFormState> {
  const user = await requireUser();

  const websiteUrlRaw = String(formData.get("website_url") ?? "").trim();
  const businessName = String(formData.get("business_name") ?? "").trim();
  const projectSlug =
    String(formData.get("project_slug") ?? "mint-chip-website").trim() ||
    "mint-chip-website";

  const fieldErrors: GenerateDemoFormState["fieldErrors"] = {};

  if (!websiteUrlRaw) {
    fieldErrors.websiteUrl = "Website URL is required.";
  } else {
    try {
      new URL(normalizeWebsiteUrl(websiteUrlRaw));
    } catch {
      fieldErrors.websiteUrl = "Enter a valid website URL.";
    }
  }

  if (businessName.length > 160) {
    fieldErrors.businessName = "Business name must be 160 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const project = await getProjectBySlug(projectSlug);
  if (!project) {
    return {
      error: `Project "${projectSlug}" was not found.`,
      fieldErrors: {},
    };
  }

  try {
    const run = await runWebsiteFactoryPipeline(
      {
        projectId: project.id,
        websiteUrl: normalizeWebsiteUrl(websiteUrlRaw),
        businessName: businessName || null,
      },
      {
        researchProvider: new HttpResearchProvider(),
        agentRuntime: getWebsiteFactoryAgentRuntime(),
      },
    );

    if (
      run.status === "FAILED" &&
      run.failureReason?.includes("Live Hermes agent execution is not enabled")
    ) {
      run.status = "READY_FOR_LIVE_VERIFICATION";
      run.failureReason =
        "Critical factory stages are wired to Hermes but live paid execution is not enabled.";
    } else if (run.status === "COMPLETED") {
      run.status = "READY_FOR_LIVE_VERIFICATION";
      run.failureReason =
        "Fixture-tested preview prepared; live Vercel verification is pending.";
    }

    await persistWebsiteFactoryRun(run, user.id);
    await persistFactoryPreviewDeployment(run, user.id);

    redirect(`/factory/${encodeURIComponent(run.id)}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate the demo.",
      fieldErrors: {},
    };
  }
}
