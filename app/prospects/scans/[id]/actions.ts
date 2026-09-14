"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { runScanById } from "@/lib/prospecting/run-scan";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function runScan(formData: FormData): Promise<void> {
  await requireUser();

  const scanId = String(formData.get("scan_id") ?? "").trim();

  if (!UUID_PATTERN.test(scanId)) {
    redirect("/prospects/scans");
  }

  try {
    await runScanById(scanId);
    redirect(
      `/prospects/scans/${encodeURIComponent(scanId)}?ok=${encodeURIComponent("Scan completed.")}`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Scan execution failed.";
    redirect(
      `/prospects/scans/${encodeURIComponent(scanId)}?error=${encodeURIComponent(message)}`,
    );
  }
}

