"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { DEFAULT_SCAN_LIMITS } from "@/lib/prospecting/constants";
import { createAndRunScan } from "@/lib/prospecting/run-scan";
import type { CreateProspectScanFormState } from "./types";

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createProspectScan(
  _previousState: CreateProspectScanFormState,
  formData: FormData,
): Promise<CreateProspectScanFormState> {
  const user = await requireUser();

  const location = String(formData.get("location") ?? "").trim();
  const industriesRaw = String(formData.get("industries") ?? "").trim();
  const maxProspectsRaw = String(formData.get("max_prospects") ?? "100").trim();
  const radiusRaw = String(formData.get("radius_km") ?? "").trim();
  const exclusionsRaw = String(formData.get("exclusions") ?? "").trim();

  const fieldErrors: CreateProspectScanFormState["fieldErrors"] = {};
  const industries = parseList(industriesRaw);

  if (!location) {
    fieldErrors.location = "Location is required.";
  } else if (location.length > 160) {
    fieldErrors.location = "Location must be 160 characters or fewer.";
  }

  if (industries.length === 0) {
    fieldErrors.industries = "Enter at least one industry or category.";
  } else if (industries.length > DEFAULT_SCAN_LIMITS.maxIndustries) {
    fieldErrors.industries = `Enter at most ${DEFAULT_SCAN_LIMITS.maxIndustries} industries.`;
  }

  const maxProspects = Number(maxProspectsRaw);
  if (!Number.isInteger(maxProspects) || maxProspects < 1) {
    fieldErrors.maxProspects = "Maximum prospects must be a whole number of 1 or more.";
  } else if (maxProspects > DEFAULT_SCAN_LIMITS.maxProspectsHardCap) {
    fieldErrors.maxProspects = `Maximum prospects cannot exceed ${DEFAULT_SCAN_LIMITS.maxProspectsHardCap}.`;
  }

  const radiusKm = radiusRaw ? Number(radiusRaw) : null;
  if (radiusRaw && (radiusKm === null || Number.isNaN(radiusKm) || radiusKm <= 0)) {
    fieldErrors.radiusKm = "Radius must be a positive number.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  try {
    const scanId = await createAndRunScan(
      {
        location,
        radiusKm,
        industries,
        categories: [],
        maxProspects,
        exclusions: parseList(exclusionsRaw),
        sourceConfig: {
          provider: "fixture",
          isLive: false,
        },
      },
      user.id,
    );

    redirect(`/prospects/scans/${scanId}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the prospect scan.",
      fieldErrors: {},
    };
  }
}

